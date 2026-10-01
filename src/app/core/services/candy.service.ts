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

    return this.mapearProductos(data || []);
  }

  async obtenerTodosLosProductos(): Promise<ProductoCandy[]> {
    const { data, error } = await this.supabase.from('productos_candy').select('*').order('nombre');

    if (error) {
      console.error('Error al cargar todos los productos Candy:', error.message);

      return [];
    }

    return this.mapearProductos(data || []);
  }

  private mapearProductos(productos: any[]): ProductoCandy[] {
    return productos.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: Number(row.precio),
      categoriaId: row.categoria_id,
      imagenUrl: row.imagen_url,
      activo: row.activo,
    }));
  }

  async crearCategoria(nombre: string): Promise<{
    exito: boolean;
    mensaje: string;
  }> {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      return {
        exito: false,
        mensaje: 'El nombre de la categoría es obligatorio.',
      };
    }

    const { error } = await this.supabase.from('categorias_candy').insert([
      {
        id: crypto.randomUUID(),
        nombre: nombreLimpio,
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        return {
          exito: false,
          mensaje: 'Ya existe una categoría con ese nombre.',
        };
      }

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Categoría creada correctamente.',
    };
  }

  async actualizarCategoria(
    id: string,
    nombre: string,
  ): Promise<{
    exito: boolean;
    mensaje: string;
  }> {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      return {
        exito: false,
        mensaje: 'El nombre de la categoría es obligatorio.',
      };
    }

    const { error } = await this.supabase
      .from('categorias_candy')
      .update({
        nombre: nombreLimpio,
      })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return {
          exito: false,
          mensaje: 'Ya existe una categoría con ese nombre.',
        };
      }

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Categoría actualizada correctamente.',
    };
  }

  async crearProducto(producto: Omit<ProductoCandy, 'id'>): Promise<{
    exito: boolean;
    mensaje: string;
  }> {
    const { error } = await this.supabase.from('productos_candy').insert([
      {
        id: crypto.randomUUID(),
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion?.trim() || null,
        precio: producto.precio,
        categoria_id: producto.categoriaId,
        imagen_url: producto.imagenUrl?.trim() || null,
        activo: producto.activo,
      },
    ]);

    if (error) {
      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Producto creado correctamente.',
    };
  }

  async actualizarProducto(producto: ProductoCandy): Promise<{
    exito: boolean;
    mensaje: string;
  }> {
    const { error } = await this.supabase
      .from('productos_candy')
      .update({
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion?.trim() || null,
        precio: producto.precio,
        categoria_id: producto.categoriaId,
        imagen_url: producto.imagenUrl?.trim() || null,
        activo: producto.activo,
      })
      .eq('id', producto.id);

    if (error) {
      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Producto actualizado correctamente.',
    };
  }

  async cambiarEstadoProducto(
    id: string,
    activo: boolean,
  ): Promise<{
    exito: boolean;
    mensaje: string;
  }> {
    const { error } = await this.supabase
      .from('productos_candy')
      .update({
        activo,
      })
      .eq('id', id);

    if (error) {
      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Estado del producto actualizado.',
    };
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
