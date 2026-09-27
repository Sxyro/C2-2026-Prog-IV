import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PdfService } from '../../../core/services/pdf.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion } from '../../../core/models/funcion.model';
import { Butaca } from '../../../core/models/butaca.model';

interface DatosReserva {
  pelicula: Pelicula;
  funcion: Funcion;
  butacas: Butaca[];
  total: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  private pdfService = inject(PdfService);
  private usuariosService = inject(UsuariosService);
  private reservasService = inject(ReservasService);
  private router = inject(Router);

  public datosReserva: DatosReserva | null = null;
  public emailComprador = '';
  public procesando = signal<boolean>(false);

  get cantidadAsientos(): string {
    if (!this.datosReserva) {
      return '';
    }

    return this.datosReserva.butacas.map((butaca) => `${butaca.fila}-${butaca.columna}`).join(', ');
  }

  ngOnInit(): void {
    const reserva = history.state.reserva as DatosReserva | undefined;

    if (!reserva) {
      this.router.navigate(['/cartelera']);
      return;
    }

    this.datosReserva = reserva;

    const usuario = this.usuariosService.obtenerUsuarioActual()();

    if (usuario) {
      this.emailComprador = usuario.email;
    }
  }

  async procesarPago(): Promise<void> {
    if (!this.datosReserva) {
      return;
    }

    if (!this.emailComprador.trim()) {
      alert('Ingresá un email válido.');
      return;
    }

    this.procesando.set(true);

    try {
      const usuario = this.usuariosService.obtenerUsuarioActual()();
      const usuarioId = usuario ? usuario.id : null;

      const resultadoReserva = await this.reservasService.crearReserva(
        this.datosReserva.funcion.id,
        usuarioId,
        this.emailComprador,
        this.datosReserva.total,
        this.datosReserva.butacas,
      );

      if (!resultadoReserva.exito) {
        alert(`Error al procesar la reserva: ${resultadoReserva.mensaje}`);
        return;
      }

      await this.pdfService.generarEntradaPdf({
        reservaId: resultadoReserva.reservaId!,
        pelicula: this.datosReserva.pelicula,
        funcion: this.datosReserva.funcion,
        butacas: this.datosReserva.butacas,
        total: this.datosReserva.total,
        emailComprador: this.emailComprador,
      });

      if (usuario && usuario.tieneDescuentoPrimeraCompra) {
        await this.usuariosService.usarCuponDescuento();
      }

      alert(
        '¡Pago confirmado! Se ha guardado tu reserva y descargado tu comprobante con el código QR.',
      );

      this.router.navigate(['/cartelera']);
    } catch (error) {
      console.error('Error al generar la entrada:', error);
      alert('Ocurrió un error al procesar el pago o generar la entrada.');
    } finally {
      this.procesando.set(false);
    }
  }
}
