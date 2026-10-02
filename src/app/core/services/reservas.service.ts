import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ReservaUsuario } from '../models/reserva.model';

export interface ButacaSeleccionada {
  id: string;
  fila: string;
  columna: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private supabase = inject(SupabaseService).client;

  async obtenerButacasOcupadas(funcionId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('reserva_butacas')
      .select('butaca_id')
      .eq('funcion_id', funcionId);

    if (error) {
      console.error('Error al cargar butacas ocupadas:', error.message);
      return [];
    }

    return (data || []).map((row) => row.butaca_id);
  }

  suscribirseCambiosButacas(
    funcionId: string,
    callback: (evento: 'INSERT' | 'DELETE', butacaId: string) => void,
  ) {
    const canal = this.supabase
      .channel(`butacas-funcion-${funcionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reserva_butacas',
          filter: `funcion_id=eq.${funcionId}`,
        },
        (payload) => {
          if (payload.eventType !== 'INSERT' && payload.eventType !== 'DELETE') {
            return;
          }

          const butacaId =
            payload.eventType === 'INSERT' ? payload.new['butaca_id'] : payload.old['butaca_id'];

          if (!butacaId) {
            return;
          }

          callback(payload.eventType, butacaId);
        },
      )
      .subscribe();

    return canal;
  }

  async cancelarSuscripcionButacas(
    canal: ReturnType<typeof this.supabase.channel> | null,
  ): Promise<void> {
    if (!canal) {
      return;
    }

    await this.supabase.removeChannel(canal);
  }

  async crearReserva(
    funcionId: string,
    usuarioId: string | null,
    emailComprador: string,
    total: number,
    butacas: ButacaSeleccionada[],
  ): Promise<{
    exito: boolean;
    reservaId?: string;
    mensaje?: string;
  }> {
    const reservaId = crypto.randomUUID();

    const reservaRow = {
      id: reservaId,
      funcion_id: funcionId,
      usuario_id: usuarioId,
      email_comprador: emailComprador,
      total: total,
    };

    const { error: errorReserva } = await this.supabase.from('reservas').insert([reservaRow]);

    if (errorReserva) {
      console.error('Error al crear reserva:', errorReserva.message);

      return {
        exito: false,
        mensaje: errorReserva.message,
      };
    }

    const butacasRows = butacas.map((b) => ({
      reserva_id: reservaId,
      funcion_id: funcionId,
      butaca_id: b.id,
      fila: b.fila,
      columna: b.columna,
    }));

    const { error: errorButacas } = await this.supabase.from('reserva_butacas').insert(butacasRows);

    if (errorButacas) {
      await this.supabase.from('reservas').delete().eq('id', reservaId);

      if (errorButacas.code === '23505') {
        return {
          exito: false,
          mensaje:
            'Una o más de las butacas seleccionadas fueron ocupadas por otra persona mientras realizabas la compra. Volvé a seleccionar tus butacas.',
        };
      }

      console.error('Error al vincular butacas:', errorButacas.message);

      return {
        exito: false,
        mensaje: 'No se pudieron reservar los asientos elegidos.',
      };
    }

    return {
      exito: true,
      reservaId,
    };
  }

  async obtenerMisReservas(): Promise<ReservaUsuario[]> {
    const { data, error } = await this.supabase.rpc('obtener_mis_reservas');

    if (error) {
      console.error('Error al obtener mis reservas:', error.message);
      return [];
    }

    return (data || []).map((reserva: any) => ({
      reservaId: reserva.reserva_id,
      peliculaId: reserva.pelicula_id,
      peliculaNombre: reserva.pelicula_nombre,
      peliculaPortadaUrl: reserva.pelicula_portada_url,
      peliculaFormato: reserva.pelicula_formato,
      peliculaIdioma: reserva.pelicula_idioma,
      peliculaClasificacion: reserva.pelicula_clasificacion,
      funcionId: reserva.funcion_id,
      salaId: reserva.sala_id,
      salaNombre: reserva.sala_nombre,
      fechaHoraInicio: reserva.fecha_hora_inicio,
      fechaHoraFin: reserva.fecha_hora_fin,
      precioEntrada: Number(reserva.precio_entrada),
      total: Number(reserva.total),
      createdAt: reserva.created_at,
      entradaValidada: reserva.entrada_validada,
      entradaValidadaAt: reserva.entrada_validada_at,
      cancelada: reserva.cancelada,
      canceladaAt: reserva.cancelada_at,
      creditoDevuelto: Number(reserva.credito_devuelto || 0),
      butacas: (reserva.butacas || []).map((butaca: any) => ({
        id: butaca.id,
        fila: butaca.fila,
        columna: Number(butaca.columna),
      })),
      productosCandy: (reserva.productos_candy || []).map((producto: any) => ({
        id: producto.id,
        productoId: producto.producto_id,
        nombre: producto.nombre,
        cantidad: Number(producto.cantidad),
        precioUnitario: Number(producto.precio_unitario),
        subtotal: Number(producto.subtotal),
        entregado: producto.entregado,
      })),
    }));
  }

  async cancelarReserva(reservaId: string): Promise<{
    exito: boolean;
    credito?: number;
    mensaje?: string;
  }> {
    const { data, error } = await this.supabase.rpc('cancelar_reserva', {
      p_reserva_id: reservaId,
    });

    if (error) {
      console.error('Error al cancelar reserva:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: data?.exito === true,
      credito: Number(data?.credito || 0),
      mensaje: data?.exito ? 'Reserva cancelada correctamente.' : 'No se pudo cancelar la reserva.',
    };
  }
}
