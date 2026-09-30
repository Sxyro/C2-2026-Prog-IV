import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SalasService } from './salas.service';
import { Funcion } from '../models/funcion.model';

@Injectable({
  providedIn: 'root'
})
export class FuncionesService {
  private supabase = inject(SupabaseService).client;
  private salasService = inject(SalasService);

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
      console.error(
        'Error al cargar funciones de Supabase:',
        error.message
      );
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

  private salaEstaDisponible(
    salaId: string,
    inicioNuevo: number,
    finNuevo: number
  ): boolean {
    const funcionesMismaSala = this.funciones().filter(
      funcion => funcion.salaId === salaId
    );

    for (const funcionExistente of funcionesMismaSala) {
      const inicioExistente = new Date(
        funcionExistente.fechaHoraInicio
      ).getTime();

      const finExistente = new Date(
        funcionExistente.fechaHoraFin
      ).getTime();

      const finOcupacionExistente =
        finExistente + 30 * 60000;

      const finOcupacionNueva =
        finNuevo + 30 * 60000;

      const haySuperposicion =
        inicioNuevo < finOcupacionExistente &&
        finOcupacionNueva > inicioExistente;

      if (haySuperposicion) {
        return false;
      }
    }

    return true;
  }

  private async buscarSalaDisponible(
    inicioNuevo: number,
    finNuevo: number
  ): Promise<string | null> {
    let salas = this.salasService.obtenerSalas()();

    if (salas.length === 0) {
      salas = await this.salasService.cargarSalas();
    }

    for (const sala of salas) {
      if (
        this.salaEstaDisponible(
          sala.id,
          inicioNuevo,
          finNuevo
        )
      ) {
        return sala.id;
      }
    }

    return null;
  }

  async agregarFuncion(
    nuevaFuncion: Funcion
  ): Promise<{ exito: boolean; mensaje: string }> {
    const inicioNuevo = new Date(
      nuevaFuncion.fechaHoraInicio
    ).getTime();

    const finNuevo = new Date(
      nuevaFuncion.fechaHoraFin
    ).getTime();

    await this.cargarFunciones();

    const salaAsignada = await this.buscarSalaDisponible(
      inicioNuevo,
      finNuevo
    );

    if (!salaAsignada) {
      return {
        exito: false,
        mensaje:
          'No hay ninguna sala disponible para ese horario respetando los 30 minutos entre funciones.'
      };
    }

    const row = {
      id: nuevaFuncion.id,
      pelicula_id: nuevaFuncion.peliculaId,
      sala_id: salaAsignada,
      fecha_hora_inicio: nuevaFuncion.fechaHoraInicio,
      fecha_hora_fin: nuevaFuncion.fechaHoraFin,
      precio_entrada: nuevaFuncion.precioEntrada
    };

    const { error } = await this.supabase
      .from('funciones')
      .insert([row]);

    if (error) {
      console.error(
        'Error al guardar función en Supabase:',
        error.message
      );

      return {
        exito: false,
        mensaje: error.message
      };
    }

    await this.cargarFunciones();

    return {
      exito: true,
      mensaje: `Función programada con éxito. Sala asignada: ${salaAsignada}.`
    };
  }
}