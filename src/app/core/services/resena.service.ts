import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Resena } from '../models/resena.model';

@Injectable({
  providedIn: 'root'
})
export class ResenasService {
  private supabase = inject(SupabaseService).client;

  async obtenerResenas(peliculaId: string): Promise<Resena[]> {
    const { data, error } = await this.supabase
      .from('resenas')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al cargar reseñas:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      peliculaId: row.pelicula_id,
      usuarioId: row.usuario_id,
      estrellas: row.estrellas,
      comentario: row.comentario,
      fechaCreacion: row.fecha_creacion,
    }));
  }

  async obtenerPromedio(peliculaId: string): Promise<number> {
    const resenas = await this.obtenerResenas(peliculaId);

    if (resenas.length === 0) {
      return 0;
    }

    const suma = resenas.reduce(
      (total, resena) => total + resena.estrellas,
      0
    );

    return Number((suma / resenas.length).toFixed(1));
  }

  async agregarResena(
    peliculaId: string,
    estrellas: number,
    comentario: string
  ): Promise<{ exito: boolean; mensaje: string }> {
    if (estrellas < 1 || estrellas > 5) {
      return {
        exito: false,
        mensaje: 'La puntuación debe estar entre 1 y 5 estrellas.'
      };
    }

    if (!comentario.trim()) {
      return {
        exito: false,
        mensaje: 'Escribí un comentario antes de publicar.'
      };
    }

    const {
      data: { user }
    } = await this.supabase.auth.getUser();

    if (!user || !user.email) {
      return {
        exito: false,
        mensaje: 'Debés iniciar sesión para dejar una reseña.'
      };
    }

    const { data: usuario, error: errorUsuario } = await this.supabase
      .from('usuarios')
      .select('id')
      .eq('email', user.email)
      .single();

    if (errorUsuario || !usuario) {
      console.error(
        'No se encontró el usuario en la tabla usuarios:',
        errorUsuario?.message
      );

      return {
        exito: false,
        mensaje: 'No se encontró tu usuario en la base de datos.'
      };
    }

    const { error } = await this.supabase
      .from('resenas')
      .insert([{
        id: crypto.randomUUID(),
        pelicula_id: peliculaId,
        usuario_id: usuario.id,
        estrellas,
        comentario: comentario.trim(),
      }]);

    if (error) {
      console.error('Error al guardar reseña:', error.message);

      return {
        exito: false,
        mensaje: error.message
      };
    }

    return {
      exito: true,
      mensaje: '¡Reseña publicada correctamente!'
    };
  }

  async usuarioEstaAutenticado(): Promise<boolean> {
    const {
      data: { user }
    } = await this.supabase.auth.getUser();

    return !!user;
  }
}