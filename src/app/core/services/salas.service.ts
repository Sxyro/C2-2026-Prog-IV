import { Injectable, inject, signal } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { Sala } from '../models/sala.model';
import { Butaca } from '../models/butaca.model';

@Injectable({
  providedIn: 'root'
})
export class SalasService {
  private supabase = inject(SupabaseService).client;
  private salas = signal<Sala[]>([]);

  constructor() {
    this.cargarSalas();
  }

  obtenerSalas() {
    return this.salas.asReadonly();
  }

  async cargarSalas(): Promise<Sala[]> {
    const { data, error } = await this.supabase
      .from('salas')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar salas de Supabase:', error.message);
      return [];
    }

    const mapeadas: Sala[] = (data || []).map(row => ({
      id: row.id,
      nombre: row.nombre,
      filas: row.filas
    }));

    this.salas.set(mapeadas);
    return mapeadas;
  } 

  generarMapaButacas(cantidadFilas: number = 20): Butaca[] {
    const butacas: Butaca[] = [];

    const letrasFilas = [
      'A', 'B', 'C', 'D', 'E',
      'F', 'G', 'H', 'I', 'J',
      'K', 'L', 'M', 'N', 'O',
      'P', 'Q', 'R', 'S', 'T'
    ].slice(0, cantidadFilas);

    const totalColumnas = 28;

    for (const fila of letrasFilas) {
      for (let columna = 1; columna <= totalColumnas; columna++) {
        let bloque: 1 | 2 | 3 = 1;

        if (columna > 4 && columna <= 24) {
          bloque = 2;
        } else if (columna > 24) {
          bloque = 3;
        }

        butacas.push({
          id: `${fila}-${columna}`,
          fila,
          columna,
          bloque,
          ocupada: false
        });
      }
    }

    return butacas;
  }
}
