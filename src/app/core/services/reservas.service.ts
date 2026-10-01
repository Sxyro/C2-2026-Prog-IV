import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
}
