import { Pelicula } from './pelicula.model';

export interface AlertaPelicula {
  id: string;
  usuarioId: string;
  peliculaId: string;
  creadaAt: string;
  notificada: boolean;
  pelicula?: Pelicula;
}
