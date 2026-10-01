import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';

export type TipoRecompensa = 'entrada' | 'producto';

export interface RecompensaPuntos {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoRecompensa;
  productoId: string | null;
  puntosRequeridos: number;
  activa: boolean;
  createdAt: string;
}

export interface CanjePuntos {
  id: string;
  usuarioId: string;
  recompensaId: string;
  puntosUtilizados: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class PuntosService {
  private supabase = inject(SupabaseService).client;

  async obtenerRecompensas(): Promise<RecompensaPuntos[]> {
    const { data, error } = await this.supabase
      .from('recompensas_puntos')
      .select('*')
      .eq('activa', true)
      .order('puntos_requeridos');

    if (error) {
      console.error('Error al cargar recompensas:', error.message);
      return [];
    }

    return this.mapearRecompensas(data || []);
  }

  async obtenerTodasLasRecompensas(): Promise<RecompensaPuntos[]> {
    const { data, error } = await this.supabase
      .from('recompensas_puntos')
      .select('*')
      .order('puntos_requeridos');

    if (error) {
      console.error('Error al cargar todas las recompensas:', error.message);
      return [];
    }

    return this.mapearRecompensas(data || []);
  }

  async crearRecompensa(recompensa: {
    nombre: string;
    descripcion: string;
    tipo: TipoRecompensa;
    productoId: string | null;
    puntosRequeridos: number;
  }): Promise<{ exito: boolean; mensaje: string }> {
    const nombre = recompensa.nombre.trim();

    if (!nombre) {
      return {
        exito: false,
        mensaje: 'El nombre de la recompensa es obligatorio.',
      };
    }

    if (recompensa.puntosRequeridos <= 0) {
      return {
        exito: false,
        mensaje: 'Los puntos requeridos deben ser mayores a cero.',
      };
    }

    if (recompensa.tipo === 'producto' && !recompensa.productoId) {
      return {
        exito: false,
        mensaje: 'Seleccioná un producto Candy.',
      };
    }

    const { error } = await this.supabase.from('recompensas_puntos').insert([
      {
        id: crypto.randomUUID(),
        nombre,
        descripcion: recompensa.descripcion.trim() || null,
        tipo: recompensa.tipo,
        producto_id: recompensa.tipo === 'producto' ? recompensa.productoId : null,
        puntos_requeridos: recompensa.puntosRequeridos,
        activa: true,
      },
    ]);

    if (error) {
      console.error('Error al crear recompensa:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Recompensa creada correctamente.',
    };
  }

  async actualizarRecompensa(
    id: string,
    recompensa: {
      nombre: string;
      descripcion: string;
      tipo: TipoRecompensa;
      productoId: string | null;
      puntosRequeridos: number;
    },
  ): Promise<{ exito: boolean; mensaje: string }> {
    const nombre = recompensa.nombre.trim();

    if (!nombre) {
      return {
        exito: false,
        mensaje: 'El nombre de la recompensa es obligatorio.',
      };
    }

    if (recompensa.puntosRequeridos <= 0) {
      return {
        exito: false,
        mensaje: 'Los puntos requeridos deben ser mayores a cero.',
      };
    }

    if (recompensa.tipo === 'producto' && !recompensa.productoId) {
      return {
        exito: false,
        mensaje: 'Seleccioná un producto Candy.',
      };
    }

    const { error } = await this.supabase
      .from('recompensas_puntos')
      .update({
        nombre,
        descripcion: recompensa.descripcion.trim() || null,
        tipo: recompensa.tipo,
        producto_id: recompensa.tipo === 'producto' ? recompensa.productoId : null,
        puntos_requeridos: recompensa.puntosRequeridos,
      })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar recompensa:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'Recompensa actualizada correctamente.',
    };
  }

  async cambiarEstadoRecompensa(
    id: string,
    activa: boolean,
  ): Promise<{ exito: boolean; mensaje: string }> {
    const { error } = await this.supabase
      .from('recompensas_puntos')
      .update({ activa })
      .eq('id', id);

    if (error) {
      console.error('Error al cambiar estado de recompensa:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: activa
        ? 'Recompensa activada correctamente.'
        : 'Recompensa desactivada correctamente.',
    };
  }

  async eliminarRecompensa(id: string): Promise<{ exito: boolean; mensaje: string }> {
    const { error } = await this.supabase.from('recompensas_puntos').delete().eq('id', id);

    if (error) {
      console.error('Error al eliminar recompensa:', error.message);

      if (error.code === '23503') {
        return {
          exito: false,
          mensaje:
            'No se puede eliminar esta recompensa porque ya fue utilizada en un canje. Podés desactivarla para que deje de estar disponible.',
        };
      }

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: 'La recompensa fue eliminada correctamente.',
    };
  }

  async canjearRecompensa(recompensaId: string): Promise<{
    exito: boolean;
    mensaje: string;
    puntosRestantes?: number;
    canjeId?: string;
  }> {
    const { data, error } = await this.supabase.rpc('canjear_recompensa', {
      p_recompensa_id: recompensaId,
    });

    if (error) {
      console.error('Error al canjear recompensa:', error.message);

      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
      mensaje: data?.recompensa
        ? `Canje realizado: ${data.recompensa}.`
        : 'Recompensa canjeada correctamente.',
      puntosRestantes: data?.puntos_restantes,
      canjeId: data?.canje_id,
    };
  }

  async obtenerHistorialCanjes(usuarioId: string): Promise<CanjePuntos[]> {
    const { data, error } = await this.supabase.rpc('obtener_mis_canjes');

    if (error) {
      console.error('Error al cargar historial de canjes:', error.message);

      return [];
    }

    return ((data || []) as any[]).map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      recompensaId: row.recompensa_id,
      puntosUtilizados: Number(row.puntos_utilizados),
      createdAt: row.created_at,
    }));
  }

  private mapearRecompensas(data: any[]): RecompensaPuntos[] {
    return data.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipo: row.tipo as TipoRecompensa,
      productoId: row.producto_id,
      puntosRequeridos: Number(row.puntos_requeridos),
      activa: row.activa,
      createdAt: row.created_at,
    }));
  }
}
