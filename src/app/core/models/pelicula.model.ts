import { Genero } from './genero.model';

export type FormatoPelicula = '2D' | '3D' | '4D' | '5D';

export type IdiomaPelicula = 'Castellano' | 'Subtitulada';

export type ClasificacionEdad = 'ATP' | '+13' | '+18';

export interface Pelicula {
  id: string;
  nombre: string;
  generos?: Genero[];
  sinopsis: string;
  portadaUrl: string;
  duracionMinutos: number;
  formato: FormatoPelicula;
  idioma: IdiomaPelicula;
  clasificacionEdad: ClasificacionEdad;
  publicada?: boolean;
  fechaEstreno?: string | null;
  precioPreventa?: number | null;
}
