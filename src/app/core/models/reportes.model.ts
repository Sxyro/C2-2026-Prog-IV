export interface ResumenFinanciero {
  facturacion: number;
  entradasVendidas: number;
  reservasTotales: number;
  reservasCanceladas: number;
  creditoGenerado: number;
  ventasCandy: number;
}

export interface PeliculaMasVista {
  peliculaId: string;
  peliculaNombre: string;
  cantidadEntradas: number;
}

export interface CandyMasVendido {
  productoId: string;
  productoNombre: string;
  cantidadVendida: number;
  facturacion: number;
}

export interface ReporteDiario {
  facturacion: number;
  entradasVendidas: number;
  reservas: number;
  cancelaciones: number;
  creditoGenerado: number;
  ventasCandy: number;
}

export interface LogActividad {
  id: string;
  accion: string;
  descripcion: string;
  usuarioId: string | null;
  usuarioNombre: string;
  usuarioEmail: string;
  fechaHora: string;
}
