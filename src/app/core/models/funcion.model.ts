import { Pelicula } from './pelicula.model';

export const RECARGO_BUTACA_VIP = 5000;

export interface Funcion {
  id: string;
  peliculaId: string;
  salaId: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioEntrada: number;
}
