import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Funcion } from '../models/funcion.model';

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {
  private supabase = inject(SupabaseService).client;
  private funciones = signal<Funcion[]>([]);

  constructor() {
    this.cargarFunciones();
  }

  obtenerFunciones() {
    return this.funciones.asReadonly();
  }

  async cargarFunciones(): Promise<Funcion[]> {
    const { data, error } = await this.supabase
      .from('funciones')
      .select('*');

    if (error) {
      console.error('Error al cargar funciones de Supabase:', error.message);
      return [];
    }

    const mapeadas: Funcion[] = (data || []).map(row => ({
      id: row.id,
      peliculaId: row.pelicula_id,
      salaId: row.sala_id,
      fechaHoraInicio: row.fecha_hora_inicio,
      fechaHoraFin: row.fecha_hora_fin,
      precioEntrada: Number(row.precio_entrada)
    }));

    this.funciones.set(mapeadas);
    return mapeadas;
  }

  async agregarFuncion(nuevaFuncion: Funcion): Promise<{ exito: boolean; mensaje: string }> {
    const inicioNuevo = new Date(nuevaFuncion.fechaHoraInicio).getTime();
    const finNuevo = new Date(nuevaFuncion.fechaHoraFin).getTime();

    const funcionesMismaSala = this.funciones()
      .filter(f => f.salaId === nuevaFuncion.salaId);

    for (const funcionExistente of funcionesMismaSala) {
      const inicioExistente = new Date(funcionExistente.fechaHoraInicio).getTime();
      const finExistente = new Date(funcionExistente.fechaHoraFin).getTime();

      const finOcupacionExistente = finExistente + 30 * 60000;
      const finOcupacionNueva = finNuevo + 30 * 60000;

      const haySuperposicion =
        inicioNuevo < finOcupacionExistente &&
        finOcupacionNueva > inicioExistente;

      if (haySuperposicion) {
        return {
          exito: false,
          mensaje: 'Conflicto de horario: la sala está ocupada o no se respetan los 30 minutos entre funciones.'
        };
      }
    }

    const row = {
      id: nuevaFuncion.id,
      pelicula_id: nuevaFuncion.peliculaId,
      sala_id: nuevaFuncion.salaId,
      fecha_hora_inicio: nuevaFuncion.fechaHoraInicio,
      fecha_hora_fin: nuevaFuncion.fechaHoraFin,
      precio_entrada: nuevaFuncion.precioEntrada
    };

    const { error } = await this.supabase
      .from('funciones')
      .insert([row]);

    if (error) {
      console.error('Error al guardar función en Supabase:', error.message);
      return { exito: false, mensaje: error.message };
    }

    await this.cargarFunciones();
    return { exito: true, mensaje: 'Función programada con éxito.' };
  }
}