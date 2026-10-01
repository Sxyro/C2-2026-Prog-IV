import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);

  public email = '';
  public password = '';
  public cargando = signal(false);

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  async ingresar(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.abrirModal(
        'Datos incompletos',
        'Ingresá tu email y contraseña para iniciar sesión.',
        'error'
      );
      return;
    }

    this.cargando.set(true);

    const resultado = await this.usuariosService.iniciarSesion(
      this.email,
      this.password
    );

    this.cargando.set(false);

    if (!resultado.exito) {
      this.abrirModal(
        'No se pudo iniciar sesión',
        resultado.mensaje || 'No se pudo iniciar sesión.',
        'error'
      );
      return;
    }

    this.router.navigate(['/cartelera']);
  }

  abrirModal(
    titulo: string,
    mensaje: string,
    tipo: 'error' | 'exito' = 'error'
  ): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }
}