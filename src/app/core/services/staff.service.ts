import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Staff, RolStaff } from '../models/staff.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private supabase = inject(SupabaseService).client;

  private staffActual = signal<Staff | null>(null);
  private sesionListaPromise: Promise<void>;

  constructor() {

    this.sesionListaPromise = this.restaurarSesion();

    this.supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (!sesion) {
        this.staffActual.set(null);
      }
    });
  }

  obtenerStaffActual() {
    return this.staffActual.asReadonly();
  }

  async esperarSesionLista(): Promise<void> {
    await this.sesionListaPromise;
  }

  private async restaurarSesion(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    const userId = data.session?.user.id;

    if (userId) {
      await this.cargarPerfilStaff(userId);
    }
  }

  private async cargarPerfilStaff(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('No se encontró perfil de staff para este usuario:', error?.message);
      this.staffActual.set(null);
      return;
    }

    this.staffActual.set({
      id: data.id,
      nombre: data.nombre,
      rol: data.rol as RolStaff
    });
  }

  async iniciarSesion(email: string, password: string): Promise<{ exito: boolean; mensaje?: string }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error || !data.user) {
      return { exito: false, mensaje: 'Email o contraseña incorrectos.' };
    }

    await this.cargarPerfilStaff(data.user.id);

    if (!this.staffActual()) {
      await this.supabase.auth.signOut();
      return { exito: false, mensaje: 'Tu usuario no tiene permisos de personal del cine.' };
    }

    return { exito: true };
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
    this.staffActual.set(null);
  }

  esAdmin(): boolean {
    return this.staffActual()?.rol === 'admin';
  }

  esEmpleadoOAdmin(): boolean {
    const staff = this.staffActual();
    return staff?.rol === 'admin' || staff?.rol === 'empleado';
  }
}
