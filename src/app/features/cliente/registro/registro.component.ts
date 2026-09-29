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
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    tipoSangre: ['A+', [Validators.required]],
    colorOjos: ['', [Validators.required]],
    diasVacaciones: [0, [Validators.required, Validators.min(0)]],
  });

  public async registrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();

    const resultado = await this.usuariosService.registrarUsuario({
      email: valor.email || '',
      password: valor.password || '',
      nombre: valor.nombre || '',
      apellido: valor.apellido || '',
      fechaNacimiento: valor.fechaNacimiento || '',
      tipoSangre: valor.tipoSangre || '',
      colorOjos: valor.colorOjos || '',
      diasVacaciones: valor.diasVacaciones || 0
    });

    if (!resultado.exito) {
      alert(resultado.mensaje || 'No se pudo completar el registro.');
      return;
    }

    alert(
      `¡Registro exitoso! Se ha aplicado un ${this.configuracion().porcentajeDescuentoPrimeraCompra}% de descuento para tu primera compra.`
    );

    this.router.navigate(['/cartelera']);
  }

  public omitirAnonimo(): void {
    this.usuariosService.continuarComoAnonimo();
    this.router.navigate(['/cartelera']);
  }
}