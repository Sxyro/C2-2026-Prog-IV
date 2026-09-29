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

  async ingresar(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      alert('Ingresá tu email y contraseña.');
      return;
    }

    this.cargando.set(true);

    const resultado = await this.usuariosService.iniciarSesion(
      this.email,
      this.password
    );

    this.cargando.set(false);

    if (!resultado.exito) {
      alert(resultado.mensaje || 'No se pudo iniciar sesión.');
      return;
    }
    this.router.navigate(['/cartelera']);
  }
}