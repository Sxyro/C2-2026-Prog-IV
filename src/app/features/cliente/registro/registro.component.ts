import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private configuracionService = inject(ConfiguracionService);
  private router = inject(Router);

  public configuracion = this.configuracionService.obtenerConfiguracion();

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    tipoSangre: ['A+', [Validators.required]],
    colorOjos: ['', [Validators.required]],
    diasVacaciones: [0, [Validators.required, Validators.min(0)]],
  });

  public registrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.usuariosService.registrarUsuario(this.form.value as any);
    alert(
      `¡Registro exitoso! Se ha aplicado un ${this.configuracion().porcentajeDescuentoPrimeraCompra}% de descuento para tu primera compra.`,
    );
    this.router.navigate(['/cartelera']);
  }

  public omitirAnonimo() {
    this.usuariosService.continuarComoAnonimo();
    this.router.navigate(['/cartelera']);
  }
}
