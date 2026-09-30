import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-descuentos-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './descuentos-admin.component.html',
  styleUrl: './descuentos-admin.component.css',
})
export class DescuentosAdminComponent {
  private configuracionService = inject(ConfiguracionService);

  public configuracion =
    this.configuracionService.obtenerConfiguracion();

  public porcentajeDescuentoForm = 20;

  public guardandoDescuento = signal(false);

  public mensajeDescuentoGuardado =
    signal<string | null>(null);

  public porcentajeDescuentoMayores50Form = 30;

  public guardandoDescuentoMayores50 =
    signal(false);

  public mensajeDescuentoMayores50Guardado =
    signal<string | null>(null);

  constructor() {
    effect(() => {
      this.porcentajeDescuentoForm =
        this.configuracion()
          .porcentajeDescuentoPrimeraCompra;

      this.porcentajeDescuentoMayores50Form =
        this.configuracion()
          .porcentajeDescuentoMayores50;
    });
  }

  async guardarPorcentajeDescuento(): Promise<void> {
    this.guardandoDescuento.set(true);
    this.mensajeDescuentoGuardado.set(null);

    const exito =
      await this.configuracionService.actualizarPorcentajeDescuento(
        this.porcentajeDescuentoForm
      );

    this.guardandoDescuento.set(false);

    this.mensajeDescuentoGuardado.set(
      exito
        ? 'Porcentaje actualizado correctamente.'
        : 'No se pudo guardar el cambio.'
    );
  }

  async guardarPorcentajeMayores50(): Promise<void> {
    this.guardandoDescuentoMayores50.set(true);
    this.mensajeDescuentoMayores50Guardado.set(null);

    const exito =
      await this.configuracionService.actualizarPorcentajeMayores50(
        this.porcentajeDescuentoMayores50Form
      );

    this.guardandoDescuentoMayores50.set(false);

    this.mensajeDescuentoMayores50Guardado.set(
      exito
        ? 'Descuento para mayores de 50 actualizado correctamente.'
        : 'No se pudo guardar el cambio.'
    );
  }
}