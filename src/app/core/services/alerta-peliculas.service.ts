import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AlertaPelicula } from '../models/alerta-pelicula.model';

@Injectable({
  providedIn: 'root',
})
export class AlertasPeliculasService {
  private supabase = inject(SupabaseService).client;

  async activarAlerta(
    usuarioId: string,
    peliculaId: string,
  ): Promise<{ exito: boolean; mensaje: string }> {
    const { error } = await this.supabase.from('alertas_peliculas').insert([
      {
        usuario_id: usuarioId,
        pelicula_id: peliculaId,
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        return {
          exito: false,
          mensaje: 'Ya tenés una alerta activada para esta película.',
        };
      }

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Alerta activada correctamente.',
    };
  }

  async desactivarAlerta(
    usuarioId: string,
    peliculaId: string,
  ): Promise<{ exito: boolean; mensaje: string }> {
    const { error } = await this.supabase
      .from('alertas_peliculas')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('pelicula_id', peliculaId);

    if (error) {
      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Alerta desactivada.',
    };
  }

  async obtenerMisAlertas(usuarioId: string): Promise<AlertaPelicula[]> {
    const { data, error } = await this.supabase
      .from('alertas_peliculas')
      .select(
        `
        id,
        usuario_id,
        pelicula_id,
        creada_at,
        notificada,
        pelicula:peliculas (
          id,
          nombre,
          sinopsis,
          portada_url,
          duracion_minutos,
          formato,
          idioma,
          publicada,
          clasificacion_edad,
          fecha_estreno,
          precio_preventa
        )
      `,
      )
      .eq('usuario_id', usuarioId)
      .order('creada_at', { ascending: false });

    if (error) {
      console.error('Error al cargar alertas:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      peliculaId: row.pelicula_id,
      creadaAt: row.creada_at,
      notificada: row.notificada,
      pelicula: row.pelicula
        ? {
            id: row.pelicula.id,
            nombre: row.pelicula.nombre,
            sinopsis: row.pelicula.sinopsis,
            portadaUrl: row.pelicula.portada_url,
            duracionMinutos: row.pelicula.duracion_minutos,
            formato: row.pelicula.formato,
            idioma: row.pelicula.idioma,
            publicada: row.pelicula.publicada,
            clasificacionEdad: row.pelicula.clasificacion_edad,
            fechaEstreno: row.pelicula.fecha_estreno,
            precioPreventa:
              row.pelicula.precio_preventa === null ? null : Number(row.pelicula.precio_preventa),
          }
        : undefined,
    }));
  }

  async obtenerAlertasDisponibles(
    usuarioId: string,
    peliculaIdsConFunciones: string[],
  ): Promise<AlertaPelicula[]> {
    const alertas = await this.obtenerMisAlertas(usuarioId);
    const ahora = Date.now();
    const disponibles: AlertaPelicula[] = [];

    for (const alerta of alertas) {
      const pelicula = alerta.pelicula;

      if (!pelicula?.fechaEstreno) {
        continue;
      }

      const inicioPreventa =
        new Date(`${pelicula.fechaEstreno}T00:00:00`).getTime() - 7 * 24 * 60 * 60 * 1000;

      const hayFunciones = peliculaIdsConFunciones.includes(pelicula.id);

      if (!alerta.notificada && ahora >= inicioPreventa && hayFunciones) {
        const { error } = await this.supabase
          .from('alertas_peliculas')
          .update({
            notificada: true,
          })
          .eq('id', alerta.id)
          .eq('usuario_id', usuarioId);

        if (!error) {
          disponibles.push({
            ...alerta,
            notificada: true,
          });
        }
      }
    }

    return disponibles;
  }
}
