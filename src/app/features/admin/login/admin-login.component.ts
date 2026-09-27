import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  private staffService = inject(StaffService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public email = '';
  public password = '';
  public cargando = signal(false);
  public errorMensaje = signal<string | null>(null);

  async ingresar(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.errorMensaje.set('Completá email y contraseña.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const resultado = await this.staffService.iniciarSesion(this.email, this.password);

    this.cargando.set(false);

    if (!resultado.exito) {
      this.errorMensaje.set(resultado.mensaje ?? 'No se pudo iniciar sesión.');
      return;
    }

    const destino = this.route.snapshot.queryParamMap.get('redirect') ?? '/admin';
    this.router.navigateByUrl(destino);
  }
}
