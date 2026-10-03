import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  CandyMasVendido,
  LogActividad,
  PeliculaMasVista,
  ReporteDiario,
  ResumenFinanciero,
} from '../models/reportes.model';

interface ResumenFinancieroRow {
  facturacion: number | string;
  entradas_vendidas: number | string;
  reservas_totales: number | string;
  reservas_canceladas: number | string;
  credito_generado: number | string;
  ventas_candy: number | string;
}

interface PeliculaMasVistaRow {
  pelicula_id: string;
  pelicula_nombre: string;
  cantidad_entradas: number | string;
}

interface CandyMasVendidoRow {
  producto_id: string;
  producto_nombre: string;
  cantidad_vendida: number | string;
  facturacion: number | string;
}

interface ReporteDiarioRow {
  facturacion: number | string;
  entradas_vendidas: number | string;
  reservas: number | string;
  cancelaciones: number | string;
  credito_generado: number | string;
  ventas_candy: number | string;
}

interface LogActividadRow {
  id: string;
  accion: string;
  descripcion: string;
  usuario_id: string | null;
  usuario_nombre: string;
  usuario_email: string;
  fecha_hora: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private supabase = inject(SupabaseService).client;

  async obtenerResumenFinanciero(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ResumenFinanciero | null> {
    const { data, error } = await this.supabase.rpc('obtener_resumen_financiero', {
      p_fecha_desde: fechaDesde || null,
      p_fecha_hasta: fechaHasta || null,
    });

    if (error) {
      console.error('Error al obtener resumen financiero:', error.message);
      return null;
    }

    const filas = (data || []) as ResumenFinancieroRow[];
    const row = filas[0];

    if (!row) {
      return null;
    }

    return {
      facturacion: Number(row.facturacion),
      entradasVendidas: Number(row.entradas_vendidas),
      reservasTotales: Number(row.reservas_totales),
      reservasCanceladas: Number(row.reservas_canceladas),
      creditoGenerado: Number(row.credito_generado),
      ventasCandy: Number(row.ventas_candy),
    };
  }

  async obtenerPeliculasMasVistas(periodo: 'semanal' | 'mensual'): Promise<PeliculaMasVista[]> {
    const { data, error } = await this.supabase.rpc('obtener_peliculas_mas_vistas', {
      p_periodo: periodo,
    });

    if (error) {
      console.error('Error al obtener películas más vistas:', error.message);
      return [];
    }

    const filas = (data || []) as PeliculaMasVistaRow[];

    return filas.map((row: PeliculaMasVistaRow) => ({
      peliculaId: row.pelicula_id,
      peliculaNombre: row.pelicula_nombre,
      cantidadEntradas: Number(row.cantidad_entradas),
    }));
  }

  async obtenerCandyMasVendido(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<CandyMasVendido[]> {
    const { data, error } = await this.supabase.rpc('obtener_candy_mas_vendido', {
      p_fecha_desde: fechaDesde || null,
      p_fecha_hasta: fechaHasta || null,
    });

    if (error) {
      console.error('Error al obtener Candy más vendido:', error.message);
      return [];
    }

    const filas = (data || []) as CandyMasVendidoRow[];

    return filas.map((row: CandyMasVendidoRow) => ({
      productoId: row.producto_id,
      productoNombre: row.producto_nombre,
      cantidadVendida: Number(row.cantidad_vendida),
      facturacion: Number(row.facturacion),
    }));
  }

  async obtenerReporteDiario(fecha: string): Promise<ReporteDiario | null> {
    const { data, error } = await this.supabase.rpc('obtener_reporte_diario', {
      p_fecha: fecha,
    });

    if (error) {
      console.error('Error al obtener reporte diario:', error.message);
      return null;
    }

    const filas = (data || []) as ReporteDiarioRow[];
    const row = filas[0];

    if (!row) {
      return null;
    }

    return {
      facturacion: Number(row.facturacion),
      entradasVendidas: Number(row.entradas_vendidas),
      reservas: Number(row.reservas),
      cancelaciones: Number(row.cancelaciones),
      creditoGenerado: Number(row.credito_generado),
      ventasCandy: Number(row.ventas_candy),
    };
  }

  async obtenerLogActividad(limite = 50): Promise<LogActividad[]> {
    const { data, error } = await this.supabase.rpc('obtener_log_actividad', {
      p_limite: limite,
    });

    if (error) {
      console.error('Error al obtener log de actividad:', error.message);
      return [];
    }

    const filas = (data || []) as LogActividadRow[];

    return filas.map((row: LogActividadRow) => ({
      id: row.id,
      accion: row.accion,
      descripcion: row.descripcion,
      usuarioId: row.usuario_id,
      usuarioNombre: row.usuario_nombre,
      usuarioEmail: row.usuario_email,
      fechaHora: row.fecha_hora,
    }));
  }
}
