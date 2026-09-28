import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Genero } from '../models/genero.model';

@Injectable({
  providedIn: 'root'
})
export class GenerosService {
  private supabase = inject(SupabaseService).client;

  async obtenerGeneros(): Promise<Genero[]> {
    const { data, error } = await this.supabase
      .from('generos')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al obtener géneros:', error.message);
      return [];
    }

    return data || [];
  }
}