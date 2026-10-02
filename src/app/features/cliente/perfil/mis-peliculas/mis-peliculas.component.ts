import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { ReservasService } from '../../../../core/services/reservas.service';
import { ReservaUsuario } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-mis-peliculas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-peliculas.component.html',
  styleUrl: './mis-peliculas.component.css',
})
export class MisPeliculasComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private reservasService = inject(ReservasService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public usuarioActual = this.usuariosService.obtenerUsuarioActual();
  public reservas: ReservaUsuario[] = [];
  public cargando = signal(true);
  public cancelando = signal<string | null>(null);
  public mensajeError = '';

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';
  public modalConfirmacion = false;
  public accionConfirmacion: (() => void) | null = null;

  async ngOnInit(): Promise<void> {
    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuarioActual();

    if (!usuario) {
      this.cargando.set(false);
      await this.router.navigate(['/login']);
      return;
    }

    await this.cargarReservas();
  }

  private async cargarReservas(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError = '';

    try {
      this.reservas = await this.reservasService.obtenerMisReservas();
    } catch (error) {
      console.error('Error al cargar Mis películas:', error);
      this.reservas = [];
      this.mensajeError = 'No se pudieron cargar tus compras. Intentá nuevamente.';
    } finally {
      this.cargando.set(false);
      this.cdr.detectChanges();
    }
  }

  esProxima(reserva: ReservaUsuario): boolean {
    return new Date(reserva.fechaHoraInicio).getTime() > Date.now();
  }

  esPasada(reserva: ReservaUsuario): boolean {
    return !this.esProxima(reserva);
  }

  puedeCancelar(reserva: ReservaUsuario): boolean {
    if (reserva.cancelada || reserva.entradaValidada || !this.esProxima(reserva)) {
      return false;
    }

    const diferencia = new Date(reserva.fechaHoraInicio).getTime() - Date.now();

    return diferencia >= 2 * 60 * 60 * 1000;
  }

  obtenerEstado(reserva: ReservaUsuario): string {
    if (reserva.cancelada) {
      return 'Cancelada';
    }

    if (reserva.entradaValidada) {
      return 'Utilizada';
    }

    if (this.esProxima(reserva)) {
      return 'Próxima';
    }

    return 'Finalizada';
  }

  obtenerClaseEstado(reserva: ReservaUsuario): string {
    if (reserva.cancelada) {
      return 'estado-cancelada';
    }

    if (reserva.entradaValidada) {
      return 'estado-utilizada';
    }

    if (this.esProxima(reserva)) {
      return 'estado-proxima';
    }

    return 'estado-finalizada';
  }

  cancelarReserva(reserva: ReservaUsuario): void {
    if (!this.puedeCancelar(reserva) || this.cancelando()) {
      return;
    }

    this.modalTitulo = 'Cancelar reserva';
    this.modalMensaje = `¿Querés cancelar la reserva de "${reserva.peliculaNombre}"? Se te devolverán $${this.formatearPrecio(reserva.total)} como crédito en tu cuenta.`;
    this.modalTipo = 'error';
    this.modalConfirmacion = true;
    this.modalAbierto = true;

    this.accionConfirmacion = () => {
      this.cerrarModal();
      void this.ejecutarCancelacion(reserva);
    };
  }

  private async ejecutarCancelacion(reserva: ReservaUsuario): Promise<void> {
    if (this.cancelando()) {
      return;
    }

    this.cancelando.set(reserva.reservaId);
    this.mensajeError = '';

    try {
      const resultado = await this.reservasService.cancelarReserva(reserva.reservaId);

      if (!resultado.exito) {
        this.mensajeError =
          resultado.mensaje || 'No se pudo cancelar la reserva. Intentá nuevamente.';
        return;
      }

      await this.cargarReservas();
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      this.mensajeError = 'No se pudo cancelar la reserva. Intentá nuevamente.';
    } finally {
      this.cancelando.set(null);
      this.cdr.detectChanges();
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearPrecio(precio: number): string {
    return precio.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  obtenerButacas(reserva: ReservaUsuario): string {
    return reserva.butacas.map((butaca) => `${butaca.fila}-${butaca.columna}`).join(', ');
  }

  obtenerCantidadCandy(reserva: ReservaUsuario): number {
    return reserva.productosCandy.reduce((total, producto) => total + producto.cantidad, 0);
  }

  tieneCandy(reserva: ReservaUsuario): boolean {
    return reserva.productosCandy.length > 0;
  }

  abrirModal(titulo: string, mensaje: string, tipo: 'error' | 'exito' = 'error'): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
    this.modalConfirmacion = false;
    this.accionConfirmacion = null;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalConfirmacion = false;
    this.accionConfirmacion = null;
  }

  ejecutarConfirmacion(): void {
    const accion = this.accionConfirmacion;

    if (accion) {
      accion();
    } else {
      this.cerrarModal();
    }
  }

  async recargar(): Promise<void> {
    await this.cargarReservas();
  }
}
