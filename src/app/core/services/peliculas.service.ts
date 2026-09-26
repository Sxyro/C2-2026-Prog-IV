import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Pelicula } from '../models/pelicula.model';

@Injectable({
  providedIn: 'root'
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
    let query = this.supabase.from('peliculas').select('*');

    if (soloPublicadas) {
      query = query.eq('publicada', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar películas de Supabase:', error.message);
      return [];
    }

    const mapeadas: Pelicula[] = (data || []).map(row => ({
      id: row.id,
      nombre: row.nombre,
      sinopsis: row.sinopsis,
      portadaUrl: row.portada_url,
      duracionMinutos: row.duracion_minutos,
      formato: row.formato,
      idioma: row.idioma,
      publicada: row.publicada
    }));

    this.peliculas.set(mapeadas);
    return mapeadas;
  }

  async agregarPelicula(pelicula: Pelicula): Promise<boolean> {
    const row = {
      id: pelicula.id,
      nombre: pelicula.nombre,
      sinopsis: pelicula.sinopsis,
      portada_url: pelicula.portadaUrl,
      duracion_minutos: pelicula.duracionMinutos,
      formato: pelicula.formato,
      idioma: pelicula.idioma,
      publicada: true
    };

    const { error } = await this.supabase
      .from('peliculas')
      .insert([row]);

    if (error) {
      console.error('Error al guardar película en Supabase:', error.message);
      return false;
    }

    await this.cargarPeliculas();
    return true;
  }

  async cambiarEstadoPublicacion(peliculaId: string, estaPublicada: boolean): Promise<boolean> {
    const { error } = await this.supabase
      .from('peliculas')
      .update({ publicada: estaPublicada })
      .eq('id', peliculaId);

    if (error) {
      console.error('Error al cambiar visibilidad:', error.message);
      return false;
    }

    await this.cargarPeliculas();
    return true;
  }
}