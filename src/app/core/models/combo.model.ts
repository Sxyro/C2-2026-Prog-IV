export interface Combo {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  cantidadEntradas: number;
  imagenUrl: string | null;
  activo: boolean;
  createdAt?: string;
}

export interface ComboProducto {
  id: string;
  comboId: string;
  productoId: string;
  cantidad: number;
}

export interface ComboProductoDetalle {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface ComboCompleto extends Combo {
  productos: ComboProductoDetalle[];
}

export interface ComboSeleccionado {
  combo: Combo;
  cantidad: number;
  subtotal: number;
}
