import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  PuntosService,
  RecompensaPuntos,
  TipoRecompensa,
} from '../../../core/services/puntos.service';

import { CandyService } from '../../../core/services/candy.service';
import { ProductoCandy } from '../../../core/models/producto-candy.model';

@Component({
  selector: 'app-recompensas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recompensas-admin.component.html',
  styleUrl: './recompensas-admin.component.css',
})
export class RecompensasAdminComponent implements OnInit {
  private puntosService = inject(PuntosService);
  private candyService = inject(CandyService);
  private cdr = inject(ChangeDetectorRef);

  recompensas: RecompensaPuntos[] = [];
  productos: ProductoCandy[] = [];

  cargando = true;
  guardando = false;
  eliminando = false;

  mensaje = '';
  tipoMensaje: 'exito' | 'error' = 'exito';

  mostrarModal = false;
  tituloModal = '';
  mensajeModal = '';
  tipoModal: 'exito' | 'error' = 'exito';

  mostrarModalEliminar = false;
  recompensaAEliminar: RecompensaPuntos | null = null;

  editandoId: string | null = null;

  nombre = '';
  descripcion = '';
  tipo: TipoRecompensa = 'entrada';
  productoId: string | null = null;
  puntosRequeridos = 500;

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.cdr.detectChanges();

    const [recompensas, productos] = await Promise.all([
      this.puntosService.obtenerTodasLasRecompensas(),
      this.candyService.obtenerTodosLosProductos(),
    ]);

    this.recompensas = recompensas;
    this.productos = productos;
    this.cargando = false;

    this.cdr.detectChanges();
  }

  async cargarRecompensas(): Promise<void> {
    this.recompensas = await this.puntosService.obtenerTodasLasRecompensas();

    this.cdr.detectChanges();
  }

  seleccionarTipo(tipo: TipoRecompensa): void {
    this.tipo = tipo;

    if (tipo === 'entrada') {
      this.productoId = null;
    }

    this.cdr.detectChanges();
  }

  editarRecompensa(recompensa: RecompensaPuntos): void {
    this.editandoId = recompensa.id;
    this.nombre = recompensa.nombre;
    this.descripcion = recompensa.descripcion ?? '';
    this.tipo = recompensa.tipo;
    this.productoId = recompensa.productoId;
    this.puntosRequeridos = recompensa.puntosRequeridos;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    this.cdr.detectChanges();
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
    this.cdr.detectChanges();
  }

  async guardarRecompensa(): Promise<void> {
    if (this.guardando) {
      return;
    }

    this.guardando = true;
    this.mensaje = '';

    this.cdr.detectChanges();

    const datos = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      tipo: this.tipo,
      productoId: this.tipo === 'producto' ? this.productoId : null,
      puntosRequeridos: Number(this.puntosRequeridos),
    };

    try {
      const resultado = this.editandoId
        ? await this.puntosService.actualizarRecompensa(this.editandoId, datos)
        : await this.puntosService.crearRecompensa(datos);

      if (!resultado.exito) {
        this.mostrarModalResultado('No se pudo guardar', resultado.mensaje, false);

        return;
      }

      const estabaEditando = !!this.editandoId;

      this.limpiarFormulario();

      await this.cargarRecompensas();

      this.mostrarModalResultado(
        estabaEditando ? '¡Recompensa actualizada!' : '¡Recompensa creada con éxito!',
        estabaEditando
          ? 'Los cambios fueron guardados correctamente.'
          : 'La recompensa quedó disponible para los usuarios.',
        true,
      );
    } catch (error) {
      console.error('Error al guardar recompensa:', error);

      this.mostrarModalResultado(
        'Error',
        'Ocurrió un error inesperado al guardar la recompensa.',
        false,
      );
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  async cambiarEstado(recompensa: RecompensaPuntos): Promise<void> {
    const resultado = await this.puntosService.cambiarEstadoRecompensa(
      recompensa.id,
      !recompensa.activa,
    );

    if (!resultado.exito) {
      this.mostrarModalResultado('No se pudo cambiar el estado', resultado.mensaje, false);

      return;
    }

    await this.cargarRecompensas();

    this.mostrarModalResultado(
      recompensa.activa ? 'Recompensa desactivada' : 'Recompensa activada',
      resultado.mensaje,
      true,
    );

    this.cdr.detectChanges();
  }

  confirmarEliminar(recompensa: RecompensaPuntos): void {
    if (this.guardando || this.eliminando) {
      return;
    }

    this.recompensaAEliminar = recompensa;
    this.mostrarModalEliminar = true;

    this.cdr.detectChanges();
  }

  cerrarModalEliminar(): void {
    if (this.eliminando) {
      return;
    }

    this.mostrarModalEliminar = false;
    this.recompensaAEliminar = null;

    this.cdr.detectChanges();
  }

  async eliminarRecompensa(): Promise<void> {
    if (!this.recompensaAEliminar || this.eliminando) {
      return;
    }

    const recompensa = this.recompensaAEliminar;

    this.eliminando = true;

    this.cdr.detectChanges();

    try {
      const resultado = await this.puntosService.eliminarRecompensa(recompensa.id);

      this.mostrarModalEliminar = false;
      this.recompensaAEliminar = null;

      if (!resultado.exito) {
        this.mostrarModalResultado('No se pudo eliminar', resultado.mensaje, false);

        return;
      }

      await this.cargarRecompensas();

      this.mostrarModalResultado('Recompensa eliminada', resultado.mensaje, true);
    } catch (error) {
      console.error('Error al eliminar recompensa:', error);

      this.mostrarModalEliminar = false;
      this.recompensaAEliminar = null;

      this.mostrarModalResultado(
        'Error',
        'Ocurrió un error inesperado al eliminar la recompensa.',
        false,
      );
    } finally {
      this.eliminando = false;
      this.cdr.detectChanges();
    }
  }

  obtenerNombreProducto(productoId: string | null): string {
    if (!productoId) {
      return '';
    }

    return (
      this.productos.find((producto) => producto.id === productoId)?.nombre ??
      'Producto no encontrado'
    );
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();
  }

  private limpiarFormulario(): void {
    this.editandoId = null;
    this.nombre = '';
    this.descripcion = '';
    this.tipo = 'entrada';
    this.productoId = null;
    this.puntosRequeridos = 500;
  }

  private mostrarModalResultado(titulo: string, mensaje: string, exito: boolean): void {
    this.tituloModal = titulo;
    this.mensajeModal = mensaje;
    this.tipoModal = exito ? 'exito' : 'error';

    this.mostrarModal = true;

    this.cdr.detectChanges();
  }
}
