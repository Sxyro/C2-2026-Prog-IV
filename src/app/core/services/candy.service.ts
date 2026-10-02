import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  CategoriaCandy,
  ProductoCandy,
  ProductoCandySeleccionado,
  ComboProducto,
  ComboProductoDetalle,
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
    const { data, error } = await this.supabase
      .from('productos_candy')
      .select('*')
      .order('nombre');

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
      cantidadEntradas: Number(row.cantidad_entradas || 0),
    }));
  }

  async crearCategoria(
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

  async crearProducto(
    producto: Omit<ProductoCandy, 'id'>,
  ): Promise<{
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
        cantidad_entradas: producto.cantidadEntradas || 0,
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

  async actualizarProducto(
    producto: ProductoCandy,
  ): Promise<{
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
        cantidad_entradas: producto.cantidadEntradas || 0,
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

  async obtenerComposicionCombo(
    comboId: string,
  ): Promise<ComboProductoDetalle[]> {
    const { data, error } = await this.supabase
      .from('combo_productos')
      .select(`
        producto_id,
        cantidad,
        productos_candy (
          nombre,
          precio
        )
      `)
      .eq('combo_id', comboId);

    if (error) {
      console.error('Error al cargar composición del combo:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      productoId: row.producto_id,
      nombre: row.productos_candy?.nombre || 'Producto',
      cantidad: Number(row.cantidad),
      precio: Number(row.productos_candy?.precio || 0),
    }));
  }

  async obtenerTodosLosProductosDeCombo(
    comboId: string,
  ): Promise<ComboProducto[]> {
    const { data, error } = await this.supabase
      .from('combo_productos')
      .select('*')
      .eq('combo_id', comboId);

    if (error) {
      console.error('Error al cargar productos del combo:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      comboId: row.combo_id,
      productoId: row.producto_id,
      cantidad: Number(row.cantidad),
    }));
  }

  async guardarComposicionCombo(
    comboId: string,
    productos: {
      productoId: string;
      cantidad: number;
    }[],
  ): Promise<{
    exito: boolean;
    mensaje: string;
  }> {
    const productosValidos = productos.filter(
      (producto) =>
        producto.productoId !== comboId &&
        producto.cantidad > 0,
    );

    const { error: errorEliminar } = await this.supabase
      .from('combo_productos')
      .delete()
      .eq('combo_id', comboId);

    if (errorEliminar) {
      return {
        exito: false,
        mensaje: errorEliminar.message,
      };
    }

    if (productosValidos.length === 0) {
      return {
        exito: true,
        mensaje: 'Composición del combo actualizada.',
      };
    }

    const filas = productosValidos.map((producto) => ({
      id: crypto.randomUUID(),
      combo_id: comboId,
      producto_id: producto.productoId,
      cantidad: producto.cantidad,
    }));

    const { error: errorInsertar } = await this.supabase
      .from('combo_productos')
      .insert(filas);

    if (errorInsertar) {
      return {
        exito: false,
        mensaje: errorInsertar.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Composición del combo actualizada.',
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

    const { error } = await this.supabase.rpc(
      'agregar_productos_candy_reserva',
      {
        p_reserva_id: reservaId,
        p_productos: productosData,
      },
    );

    if (error) {
      console.error('Error al guardar productos Candy:', error.message);
      return false;
    }

    return true;
  }
}
