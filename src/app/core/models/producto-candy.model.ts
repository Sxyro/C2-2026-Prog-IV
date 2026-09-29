export interface ProductoCandy {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoriaId: string;
  imagenUrl: string | null;
  activo: boolean;
}

export interface CategoriaCandy {
  id: string;
  nombre: string;
}

export interface ProductoCandySeleccionado {
  producto: ProductoCandy;
  cantidad: number;
  subtotal: number;
}