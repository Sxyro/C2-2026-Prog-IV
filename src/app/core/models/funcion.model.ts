import { Pelicula } from './pelicula.model';

export interface Funcion {
  id: string;
  peliculaId: string;
  salaId: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioEntrada: number;
}