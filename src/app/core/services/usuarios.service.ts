import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private supabase = inject(SupabaseService).client;
  private usuarioActual = signal<Usuario | null>(null);

  obtenerUsuarioActual() {
    return this.usuarioActual.asReadonly();
  }

  async registrarUsuario(datos: Omit<Usuario, 'id' | 'tieneDescuentoPrimeraCompra'>): Promise<Usuario | null> {
    const emailNormalizado = datos.email.trim().toLowerCase();

    const nuevoUsuario: Usuario = {
      ...datos,
      email: emailNormalizado,
      id: crypto.randomUUID(),
      tieneDescuentoPrimeraCompra: true
    };

    const row = {
      id: nuevoUsuario.id,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      fecha_nacimiento: nuevoUsuario.fechaNacimiento,
      tipo_sangre: nuevoUsuario.tipoSangre,
      color_ojos: nuevoUsuario.colorOjos,
      dias_vacaciones: nuevoUsuario.diasVacaciones,
      tiene_descuento_primera_compra: nuevoUsuario.tieneDescuentoPrimeraCompra
    };

    const { error } = await this.supabase
      .from('usuarios')
      .insert([row]);

    if (error) {
      console.error('Error al registrar usuario en Supabase:', error.message);
      return null;
    }

    this.usuarioActual.set(nuevoUsuario);
    return nuevoUsuario;
  }

  continuarComoAnonimo() {
    this.usuarioActual.set(null);
  }

  async iniciarSesion(email: string): Promise<boolean> {
    const emailBuscado = email.trim().toLowerCase();

    const { data, error } = await this.supabase
      .rpc('buscar_usuario_por_email', { p_email: emailBuscado });

    if (error) {
      console.error('Error al buscar usuario:', error.message);
      return false;
    }

    const usuarioEncontrado = Array.isArray(data) ? data[0] : data;

    if (!usuarioEncontrado) {
      return false;
    }

    const usuarioLogueado: Usuario = {
      id: usuarioEncontrado.id,
      email: usuarioEncontrado.email,
      nombre: usuarioEncontrado.nombre,
      apellido: usuarioEncontrado.apellido,
      fechaNacimiento: usuarioEncontrado.fecha_nacimiento,
      tipoSangre: usuarioEncontrado.tipo_sangre,
      colorOjos: usuarioEncontrado.color_ojos,
      diasVacaciones: usuarioEncontrado.dias_vacaciones,
      tieneDescuentoPrimeraCompra: usuarioEncontrado.tiene_descuento_primera_compra
    };

    this.usuarioActual.set(usuarioLogueado);
    return true;
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
  }

  async usarCuponDescuento(): Promise<void> {
    const usuario = this.usuarioActual();
    if (!usuario || !usuario.tieneDescuentoPrimeraCompra) return;

    const { error } = await this.supabase
      .rpc('usar_cupon_usuario', { p_usuario_id: usuario.id });

    if (error) {
      console.error('Error al aplicar cupón en Supabase:', error.message);
    } else {
      this.usuarioActual.set({
        ...usuario,
        tieneDescuentoPrimeraCompra: false
      });
    }
  }
}