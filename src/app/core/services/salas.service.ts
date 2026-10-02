import { Injectable, inject, signal } from '@angular/core';

import { SupabaseService } from './supabase.service';

import { Sala } from '../models/sala.model';

import { Butaca } from '../models/butaca.model';

@Injectable({
  providedIn: 'root',
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
      console.error(
        'Error al cargar salas de Supabase:',
        error.message,
      );
      return [];
    }

    const mapeadas: Sala[] = (data || []).map((row) => ({
      id: row.id,
      nombre: row.nombre,
      filas: row.filas,
    }));

    this.salas.set(mapeadas);

    return mapeadas;
  }

  generarMapaButacas(cantidadFilas: number = 20): Butaca[] {
    const butacas: Butaca[] = [];

    const letrasFilas = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
    ].slice(0, cantidadFilas);

    for (const fila of letrasFilas) {
      if (fila === 'J') {
        const bloquesAccesibles = [
          {
            desde: 1,
            hasta: 2,
            bloque: 1 as const,
          },
          {
            desde: 3,
            hasta: 12,
            bloque: 2 as const,
          },
          {
            desde: 13,
            hasta: 14,
            bloque: 3 as const,
          },
        ];

        for (const grupo of bloquesAccesibles) {
          for (
            let columna = grupo.desde;
            columna <= grupo.hasta;
            columna++
          ) {
            butacas.push({
              id: `J-${columna}`,
              fila: 'J',
              columna,
              bloque: grupo.bloque,
              ocupada: false,
              accesible: true,
              vip: false,
            });
          }
        }

        continue;
      }

      const esVip = fila === 'R' || fila === 'S' || fila === 'T';

      for (let columna = 1; columna <= 28; columna++) {
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
          ocupada: false,
          accesible: false,
          vip: esVip,
        });
      }
    }

    return butacas;
  }
}
