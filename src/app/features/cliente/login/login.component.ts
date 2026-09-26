import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  public cargando = signal(false);

  async ingresar(): Promise<void> {
    console.log('Intentando ingresar con:', this.email);

    if (!this.email.trim()) {
      alert('Por favor ingresá tu email.');
      return;
    }

    this.cargando.set(true);
    const exito = await this.usuariosService.iniciarSesion(this.email);
    this.cargando.set(false);

    if (exito) {
      alert('¡Bienvenido!');
      this.router.navigate(['/cartelera']);
    } else {
      alert('No se encontró ningún usuario con ese email.');
    }
  }
}