export interface ButacaReserva {
  id: string;
  fila: string;
  columna: number;
}

export interface ProductoCandyReserva {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  entregado: boolean;
}

export interface ReservaUsuario {
  reservaId: string;
  peliculaId: string;
  peliculaNombre: string;
  peliculaPortadaUrl: string;
  peliculaFormato: string;
  peliculaIdioma: string;
  peliculaClasificacion: string;
  funcionId: string;
  salaId: string;
  salaNombre: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioEntrada: number;
  total: number;
  createdAt: string;
  entradaValidada: boolean;
  entradaValidadaAt: string | null;
  cancelada: boolean;
  canceladaAt: string | null;
  creditoDevuelto: number;
  butacas: ButacaReserva[];
  productosCandy: ProductoCandyReserva[];
}
