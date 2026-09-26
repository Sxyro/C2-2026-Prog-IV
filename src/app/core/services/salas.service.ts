import {
  Injectable,
  signal
} from '@angular/core';

import { Sala } from '../models/sala.model';
import { Butaca } from '../models/butaca.model';

@Injectable({
  providedIn: 'root'
})
export class SalasService {

  private salas = signal<Sala[]>([
    {
      id: 'sala-1',
      nombre: 'Sala 1 - IMAX',
      filas: 20
    },
    {
      id: 'sala-2',
      nombre: 'Sala 2 - 3D',
      filas: 20
    }
  ]);


  obtenerSalas() {
    return this.salas.asReadonly();
  }


  generarMapaButacas(): Butaca[] {

    const butacas: Butaca[] = [];

    const letrasFilas = [
      'A', 'B', 'C', 'D', 'E',
      'F', 'G', 'H', 'I', 'J',
      'K', 'L', 'M', 'N', 'O',
      'P', 'Q', 'R', 'S', 'T'
    ];

    const totalColumnas = 28;


    for (const fila of letrasFilas) {

      for (
        let columna = 1;
        columna <= totalColumnas;
        columna++
      ) {

        let bloque: 1 | 2 | 3 = 1;

        if (
          columna > 4 &&
          columna <= 24
        ) {
          bloque = 2;

        } else if (
          columna > 24
        ) {
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