import { Injectable, inject, signal } from '@angular/core';

import { SupabaseService } from './supabase.service';

import { Usuario, RolUsuario } from '../models/usuario.model';

export interface UsuarioAdministrable {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private supabase = inject(SupabaseService).client;

  private usuarioActual = signal<Usuario | null>(null);

  private sesionListaPromise: Promise<void>;

  constructor() {
    this.sesionListaPromise = this.restaurarSesion();

    this.supabase.auth.onAuthStateChange((evento, sesion) => {
      if (!sesion) {
        this.usuarioActual.set(null);
        return;
      }

      if (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION') {
        this.cargarUsuarioPorAuthId(sesion.user.id);
      }
    });
  }

  obtenerUsuarioActual() {
    return this.usuarioActual.asReadonly();
  }

  async esperarSesionLista(): Promise<void> {
    await this.sesionListaPromise;
  }

  private async restaurarSesion(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();

    const userId = data.session?.user.id;

    if (userId) {
      await this.cargarUsuarioPorAuthId(userId);
    }
  }

  private async cargarUsuarioPorAuthId(authUserId: string): Promise<void> {
    const { data, error } = await this.supabase.rpc('obtener_usuario_actual');

    if (error || !data || data.length === 0) {
      this.usuarioActual.set(null);
      return;
    }

    const usuario = this.mapearUsuario(data[0]);

    this.usuarioActual.set(usuario);
  }

  private mapearUsuario(data: any): Usuario {
    return {
      id: data.id,
      authUserId: data.auth_user_id,
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      fechaNacimiento: data.fecha_nacimiento,
      tipoSangre: data.tipo_sangre,
      colorOjos: data.color_ojos,
      diasVacaciones: data.dias_vacaciones,
      tieneDescuentoPrimeraCompra: data.tiene_descuento_primera_compra,
      rol: data.rol as RolUsuario,
    };
  }

  async registrarUsuario(
    datos: Omit<Usuario, 'id' | 'authUserId' | 'tieneDescuentoPrimeraCompra' | 'rol'> & {
      password: string;
    },
  ): Promise<{ exito: boolean; usuario?: Usuario; mensaje?: string }> {
    const emailNormalizado = datos.email.trim().toLowerCase();

    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: emailNormalizado,
      password: datos.password,
    });

    if (authError || !authData.user) {
      return {
        exito: false,
        mensaje: authError?.message || 'No se pudo crear la cuenta.',
      };
    }

    const nuevoUsuario = {
      id: crypto.randomUUID(),
      auth_user_id: authData.user.id,
      email: emailNormalizado,
      nombre: datos.nombre,
      apellido: datos.apellido,
      fecha_nacimiento: datos.fechaNacimiento,
      tipo_sangre: datos.tipoSangre,
      color_ojos: datos.colorOjos,
      dias_vacaciones: datos.diasVacaciones,
      tiene_descuento_primera_compra: true,
      rol: 'usuario' as const,
    };

    const { error: perfilError } = await this.supabase.from('usuarios').insert([nuevoUsuario]);

    if (perfilError) {
      await this.supabase.auth.signOut();

      if (perfilError.code === '23505') {
        return {
          exito: false,
          mensaje:
            'Ya existe una cuenta registrada con ese email. Probá iniciar sesión o utilizar otro email.',
        };
      }

      return {
        exito: false,
        mensaje: perfilError.message || 'No se pudo crear el perfil del usuario.',
      };
    }

    const usuario: Usuario = {
      id: nuevoUsuario.id,
      authUserId: nuevoUsuario.auth_user_id,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      fechaNacimiento: nuevoUsuario.fecha_nacimiento,
      tipoSangre: nuevoUsuario.tipo_sangre,
      colorOjos: nuevoUsuario.color_ojos,
      diasVacaciones: nuevoUsuario.dias_vacaciones,
      tieneDescuentoPrimeraCompra: nuevoUsuario.tiene_descuento_primera_compra,
      rol: nuevoUsuario.rol,
    };

    this.usuarioActual.set(usuario);

    return {
      exito: true,
      usuario,
    };
  }

  async iniciarSesion(
    email: string,
    password: string,
  ): Promise<{ exito: boolean; mensaje?: string }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      return {
        exito: false,
        mensaje: 'Email o contraseña incorrectos.',
      };
    }

    await this.cargarUsuarioPorAuthId(data.user.id);

    if (!this.usuarioActual()) {
      await this.supabase.auth.signOut();

      return {
        exito: false,
        mensaje: 'No se encontró el perfil del usuario.',
      };
    }

    return {
      exito: true,
    };
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();

    this.usuarioActual.set(null);
  }

  continuarComoAnonimo(): void {
    this.usuarioActual.set(null);
  }

  async usarCuponDescuento(): Promise<void> {
    const usuario = this.usuarioActual();

    if (!usuario || !usuario.tieneDescuentoPrimeraCompra) {
      return;
    }

    const { error } = await this.supabase.rpc('usar_cupon_usuario', {
      p_usuario_id: usuario.id,
    });

    if (error) {
      console.error('Error al aplicar cupón en Supabase:', error.message);
      return;
    }

    this.usuarioActual.set({
      ...usuario,
      tieneDescuentoPrimeraCompra: false,
    });
  }

  async obtenerUsuariosAdmin(): Promise<UsuarioAdministrable[]> {
    const { data, error } = await this.supabase.rpc('obtener_usuarios_admin');

    if (error || !data) {
      console.error('Error al obtener usuarios:', error?.message);
      return [];
    }

    return data.map((usuario: any) => ({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol as RolUsuario,
    }));
  }

  async actualizarRolUsuario(
    usuarioId: string,
    nuevoRol: RolUsuario,
  ): Promise<{ exito: boolean; mensaje?: string }> {
    const { error } = await this.supabase.rpc('actualizar_rol_usuario', {
      p_usuario_id: usuarioId,
      p_nuevo_rol: nuevoRol,
    });

    if (error) {
      return {
        exito: false,
        mensaje: error.message,
      };
    }

    return {
      exito: true,
    };
  }
}
