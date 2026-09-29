import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PeliculaMasVendida {
  peliculaId: string;
  cantidadEntradas: number;
}

@Injectable({
  providedIn: 'root',
})
export class EstadisticasService {

  private supabase = inject(SupabaseService).client;

  async obtenerTop3PeliculasVendidas(): Promise<PeliculaMasVendida[]> {

    const { data, error } = await this.supabase.rpc(
      'obtener_top_3_peliculas_vendidas'
    );

    if (error) {
      console.error(
        'Error al obtener Top 3 de películas:',
        error.message
      );

      return [];
    }

    return (data || []).map((row: any) => ({
      peliculaId: row.pelicula_id,
      cantidadEntradas: Number(row.cantidad_entradas),
    }));
  }
}