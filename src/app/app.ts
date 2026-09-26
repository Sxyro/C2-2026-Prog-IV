import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuariosService } from './core/services/usuarios.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);

  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  cerrarSesion(): void {
    this.usuariosService.cerrarSesion();
    this.router.navigate(['/cartelera']);
  }
}