import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Combo,
  ComboProducto,
  ComboProductoDetalle,
  ComboCompleto,
  ComboSeleccionado,
} from '../models/combo.model';

@Injectable({
  providedIn: 'root',
})
export class ComboService {
  private supabase = inject(SupabaseService).client;

  async obtenerCombos(): Promise<Combo[]> {
    const { data, error } = await this.supabase
      .from('combos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al cargar combos:', error.message);
      return [];
    }

    return this.mapearCombos(data || []);
  }

  async obtenerTodosLosCombos(): Promise<Combo[]> {
    const { data, error } = await this.supabase.from('combos').select('*').order('nombre');

    if (error) {
      console.error('Error al cargar todos los combos:', error.message);
      return [];
    }

    return this.mapearCombos(data || []);
  }

  async obtenerCombo(id: string): Promise<Combo | null> {
    const { data, error } = await this.supabase
      .from('combos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error al cargar combo:', error.message);
      return null;
    }

    if (!data) return null;

    return this.mapearCombo(data);
  }

  async obtenerComboCompleto(id: string): Promise<ComboCompleto | null> {
    const combo = await this.obtenerCombo(id);

    if (!combo) {
      return null;
    }

    const productos = await this.obtenerComposicionCombo(id);

    return {
      ...combo,
      productos,
    };
  }

  async obtenerComposicionCombo(comboId: string): Promise<ComboProductoDetalle[]> {
    const { data, error } = await this.supabase
      .from('combo_productos')
      .select(
        `
        producto_id,
        cantidad,
        productos_candy (
          nombre,
          precio
        )
      `,
      )
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

  async obtenerProductosDelCombo(comboId: string): Promise<ComboProducto[]> {
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

  async crearCombo(
    combo: Omit<Combo, 'id' | 'createdAt'>,
    productos: { productoId: string; cantidad: number }[],
  ): Promise<{ exito: boolean; mensaje: string; comboId?: string }> {
    const comboId = crypto.randomUUID();

    const { error: errorCombo } = await this.supabase.from('combos').insert([
      {
        id: comboId,
        nombre: combo.nombre.trim(),
        descripcion: combo.descripcion?.trim() || null,
        precio: combo.precio,
        cantidad_entradas: combo.cantidadEntradas,
        imagen_url: combo.imagenUrl?.trim() || null,
        activo: combo.activo,
      },
    ]);

    if (errorCombo) {
      console.error('Error al crear combo:', errorCombo.message);
      return {
        exito: false,
        mensaje: errorCombo.message,
      };
    }

    const productosValidos = productos.filter(
      (producto) => producto.productoId && producto.cantidad > 0,
    );

    if (productosValidos.length > 0) {
      const filas = productosValidos.map((producto) => ({
        id: crypto.randomUUID(),
        combo_id: comboId,
        producto_id: producto.productoId,
        cantidad: producto.cantidad,
      }));

      const { error: errorProductos } = await this.supabase.from('combo_productos').insert(filas);

      if (errorProductos) {
        console.error('Error al guardar productos del combo:', errorProductos.message);

        await this.supabase.from('combos').delete().eq('id', comboId);

        return {
          exito: false,
          mensaje: errorProductos.message,
        };
      }
    }

    return {
      exito: true,
      mensaje: 'Combo creado correctamente.',
      comboId,
    };
  }

  async actualizarCombo(
    combo: Combo,
    productos: { productoId: string; cantidad: number }[],
  ): Promise<{ exito: boolean; mensaje: string }> {
    const { error: errorCombo } = await this.supabase
      .from('combos')
      .update({
        nombre: combo.nombre.trim(),
        descripcion: combo.descripcion?.trim() || null,
        precio: combo.precio,
        cantidad_entradas: combo.cantidadEntradas,
        imagen_url: combo.imagenUrl?.trim() || null,
        activo: combo.activo,
      })
      .eq('id', combo.id);

    if (errorCombo) {
      console.error('Error al actualizar combo:', errorCombo.message);

      return {
        exito: false,
        mensaje: errorCombo.message,
      };
    }

    const resultadoComposicion = await this.guardarComposicionCombo(combo.id, productos);

    if (!resultadoComposicion.exito) {
      return resultadoComposicion;
    }

    return {
      exito: true,
      mensaje: 'Combo actualizado correctamente.',
    };
  }

  async guardarComposicionCombo(
    comboId: string,
    productos: { productoId: string; cantidad: number }[],
  ): Promise<{ exito: boolean; mensaje: string }> {
    const productosValidos = productos.filter(
      (producto) => producto.productoId && producto.cantidad > 0,
    );

    const { error: errorEliminar } = await this.supabase
      .from('combo_productos')
      .delete()
      .eq('combo_id', comboId);

    if (errorEliminar) {
      console.error('Error al eliminar composición anterior:', errorEliminar.message);

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

    const { error: errorInsertar } = await this.supabase.from('combo_productos').insert(filas);

    if (errorInsertar) {
      console.error('Error al guardar composición:', errorInsertar.message);

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

  async cambiarEstadoCombo(
    id: string,
    activo: boolean,
  ): Promise<{ exito: boolean; mensaje: string }> {
    const { error } = await this.supabase.from('combos').update({ activo }).eq('id', id);

    if (error) {
      console.error('Error al cambiar estado del combo:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Estado del combo actualizado.',
    };
  }

  async eliminarCombo(id: string): Promise<{ exito: boolean; mensaje: string }> {
    const { error } = await this.supabase.from('combos').delete().eq('id', id);

    if (error) {
      console.error('Error al eliminar combo:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Combo eliminado correctamente.',
    };
  }

  async agregarCombosAReserva(reservaId: string, combos: ComboSeleccionado[]): Promise<boolean> {
    const combosData = combos.map((item) => ({
      comboId: item.combo.id,
      cantidad: item.cantidad,
      precioUnitario: item.combo.precio,
      subtotal: item.subtotal,
    }));

    const { error } = await this.supabase.rpc('agregar_combos_reserva', {
      p_reserva_id: reservaId,
      p_combos: combosData,
    });

    if (error) {
      console.error('Error al guardar combos:', error.message);
      return false;
    }

    return true;
  }

  private mapearCombos(combos: any[]): Combo[] {
    return combos.map((row) => this.mapearCombo(row));
  }

  private mapearCombo(row: any): Combo {
    return {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: Number(row.precio),
      cantidadEntradas: Number(row.cantidad_entradas || 1),
      imagenUrl: row.imagen_url,
      activo: row.activo,
      createdAt: row.created_at,
    };
  }
}
