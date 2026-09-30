import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Pelicula } from '../models/pelicula.model';

@Injectable({
  providedIn: 'root',
})
export class PeliculasService {
  private supabase = inject(SupabaseService).client;

  private peliculas = signal<Pelicula[]>([]);

  constructor() {
    this.cargarPeliculas();
  }

  obtenerPeliculas() {
    return this.peliculas.asReadonly();
  }

  async cargarPeliculas(soloPublicadas: boolean = true): Promise<Pelicula[]> {
    let query = this.supabase.from('peliculas').select(`
      *,
      pelicula_generos (
        genero:generos (
          id,
          nombre
        )
      )
    `);

    if (soloPublicadas) {
      query = query.eq('publicada', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar películas de Supabase:', error);
      return [];
    }

    const mapeadas: Pelicula[] = (data || []).map((row) => ({
      id: row.id,
      nombre: row.nombre,
      sinopsis: row.sinopsis,
      portadaUrl: row.portada_url,
      duracionMinutos: row.duracion_minutos,
      formato: row.formato,
      idioma: row.idioma,
      clasificacionEdad: row.clasificacion_edad,
      publicada: row.publicada,
      generos: (row.pelicula_generos || [])
        .map((relacion: any) => relacion.genero)
        .filter((genero: any) => genero !== null),
    }));

    this.peliculas.set(mapeadas);
    return mapeadas;
  }

  async subirPortada(archivo: File, peliculaId: string): Promise<string | null> {
    const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';

    const nombreArchivo = `${peliculaId}-${Date.now()}.${extension}`;

    const { error } = await this.supabase.storage.from('peliculas').upload(nombreArchivo, archivo, {
      cacheControl: '3600',
      upsert: false,
      contentType: archivo.type,
    });

    if (error) {
      console.error('Error al subir portada:', error.message);
      return null;
    }

    const { data } = this.supabase.storage.from('peliculas').getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }

  async agregarPelicula(pelicula: Pelicula, generosIds: string[]): Promise<boolean> {
    const row = {
      id: pelicula.id,
      nombre: pelicula.nombre,
      sinopsis: pelicula.sinopsis,
      portada_url: pelicula.portadaUrl,
      duracion_minutos: pelicula.duracionMinutos,
      formato: pelicula.formato,
      idioma: pelicula.idioma,
      clasificacion_edad: pelicula.clasificacionEdad,
      publicada: true,
    };

    const { error: errorPelicula } = await this.supabase.from('peliculas').insert([row]);

    if (errorPelicula) {
      console.error('Error al guardar película en Supabase:', errorPelicula.message);
      return false;
    }

    if (generosIds.length > 0) {
      const relaciones = generosIds.map((generoId) => ({
        pelicula_id: pelicula.id,
        genero_id: generoId,
      }));

      const { error: errorGeneros } = await this.supabase
        .from('pelicula_generos')
        .insert(relaciones);

      if (errorGeneros) {
        console.error('Error al guardar los géneros de la película:', errorGeneros.message);

        await this.supabase.from('peliculas').delete().eq('id', pelicula.id);

        return false;
      }
    }

    await this.cargarPeliculas(false);
    return true;
  }

  async cambiarEstadoPublicacion(peliculaId: string, estaPublicada: boolean): Promise<boolean> {
    const { error } = await this.supabase
      .from('peliculas')
      .update({
        publicada: estaPublicada,
      })
      .eq('id', peliculaId);

    if (error) {
      console.error('Error al cambiar visibilidad:', error.message);
      return false;
    }

    await this.cargarPeliculas();
    return true;
  }
}
