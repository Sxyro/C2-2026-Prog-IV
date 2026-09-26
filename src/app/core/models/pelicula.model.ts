export type FormatoPelicula = '2D' | '3D' | '4D' | '5D';
export type IdiomaPelicula = 'Castellano' | 'Subtitulada';

export interface Pelicula {
  id: string;
  nombre: string;
  sinopsis: string;
  portadaUrl: string;
  duracionMinutos: number;
  formato: FormatoPelicula;
  idioma: IdiomaPelicula;
  publicada?: boolean;
}