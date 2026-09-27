import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Configuracion } from '../models/configuracion.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private supabase = inject(SupabaseService).client;

  private configuracion = signal<Configuracion>({
    porcentajeDescuentoPrimeraCompra: 20
  });

  constructor() {
    this.cargarConfiguracion();
  }

  obtenerConfiguracion() {
    return this.configuracion.asReadonly();
  }

  async cargarConfiguracion(): Promise<void> {
    const { data, error } = await this.supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      console.error('No se pudo cargar la configuración, se usa el valor por defecto:', error?.message);
      return;
    }

    this.configuracion.set({
      porcentajeDescuentoPrimeraCompra: data.porcentaje_descuento_primera_compra
    });
  }

  /** Solo el admin puede llamar esto (lo bloquea RLS del lado del servidor). */
  async actualizarPorcentajeDescuento(nuevoPorcentaje: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('configuracion')
      .update({ porcentaje_descuento_primera_compra: nuevoPorcentaje })
      .eq('id', 1);

    if (error) {
      console.error('Error al actualizar el porcentaje de descuento:', error.message);
      return false;
    }

    this.configuracion.update(config => ({
      ...config,
      porcentajeDescuentoPrimeraCompra: nuevoPorcentaje
    }));

    return true;
  }
}
