import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  CategoriaCandy,
  ProductoCandy,
  ProductoCandySeleccionado,
} from '../models/producto-candy.model';

@Injectable({
  providedIn: 'root',
})
export class CandyService {
  private supabase = inject(SupabaseService).client;

  async obtenerCategorias(): Promise<CategoriaCandy[]> {
    const { data, error } = await this.supabase
      .from('categorias_candy')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error al cargar categorías Candy:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      nombre: row.nombre,
    }));
  }

  async obtenerProductos(): Promise<ProductoCandy[]> {
    const { data, error } = await this.supabase
      .from('productos_candy')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al cargar productos Candy:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: Number(row.precio),
      categoriaId: row.categoria_id,
      imagenUrl: row.imagen_url,
      activo: row.activo,
    }));
  }

  async agregarProductosAReserva(
    reservaId: string,
    productos: ProductoCandySeleccionado[],
  ): Promise<boolean> {
    const productosData = productos.map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      subtotal: item.subtotal,
    }));

    const { error } = await this.supabase.rpc('agregar_productos_candy_reserva', {
      p_reserva_id: reservaId,
      p_productos: productosData,
    });

    if (error) {
      console.error('Error al guardar productos Candy:', error.message);
      return false;
    }

    return true;
  }
}
