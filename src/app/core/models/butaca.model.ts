export interface Butaca {
  id: string;
  fila: string;
  columna: number;
  bloque: 1 | 2 | 3;
  ocupada: boolean;
  accesible: boolean;
  vip: boolean;
}
