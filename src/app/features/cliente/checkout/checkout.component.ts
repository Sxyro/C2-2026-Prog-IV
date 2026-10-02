import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PdfService } from '../../../core/services/pdf.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { CandyService } from '../../../core/services/candy.service';
import { ComboService } from '../../../core/services/combo.service';
import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion } from '../../../core/models/funcion.model';
import { Butaca } from '../../../core/models/butaca.model';
import {
  CategoriaCandy,
  ProductoCandy,
  ProductoCandySeleccionado,
} from '../../../core/models/producto-candy.model';
import { Combo, ComboSeleccionado } from '../../../core/models/combo.model';

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
  private candyService = inject(CandyService);
  private comboService = inject(ComboService);
  private router = inject(Router);

  public datosReserva: DatosReserva | null = null;
  public emailComprador = '';
  public procesando = signal(false);

  public categoriasCandy = signal<CategoriaCandy[]>([]);
  public productosCandy = signal<ProductoCandy[]>([]);
  public combos = signal<Combo[]>([]);
  public categoriaSeleccionada = signal<string>('');
  public cantidadesCandy = signal<Record<string, number>>({});
  public cantidadesCombos = signal<Record<string, number>>({});
  public usarCredito = signal(false);

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  public productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();

    if (!categoria) {
      return this.productosCandy();
    }

    return this.productosCandy().filter((producto) => producto.categoriaId === categoria);
  });

  public productosSeleccionados = computed<ProductoCandySeleccionado[]>(() => {
    return this.productosCandy()
      .map((producto) => {
        const cantidad = this.cantidadesCandy()[producto.id] || 0;

        return {
          producto,
          cantidad,
          subtotal: producto.precio * cantidad,
        };
      })
      .filter((item) => item.cantidad > 0);
  });

  public combosSeleccionados = computed<ComboSeleccionado[]>(() => {
    return this.combos()
      .map((combo) => {
        const cantidad = this.cantidadesCombos()[combo.id] || 0;

        return {
          combo,
          cantidad,
          subtotal: combo.precio * cantidad,
        };
      })
      .filter((item) => item.cantidad > 0);
  });

  public subtotalCandy = computed(() => {
    return this.productosSeleccionados().reduce((total, item) => total + item.subtotal, 0);
  });

  public subtotalCombos = computed(() => {
    return this.combosSeleccionados().reduce((total, item) => total + item.subtotal, 0);
  });

  public entradasCubiertasPorCombos = computed(() => {
    return this.combosSeleccionados().reduce(
      (total, item) => total + item.combo.cantidadEntradas * item.cantidad,
      0,
    );
  });

  public precioEntradasCubiertas = computed(() => {
    if (!this.datosReserva || this.datosReserva.butacas.length === 0) {
      return 0;
    }

    const cantidadEntradas = this.datosReserva.butacas.length;
    const entradasCubiertas = Math.min(this.entradasCubiertasPorCombos(), cantidadEntradas);
    const precioPromedio = this.datosReserva.total / cantidadEntradas;

    return precioPromedio * entradasCubiertas;
  });

  public subtotalAntesCredito = computed(() => {
    const totalEntradas = this.datosReserva?.total || 0;
    const descuentoCombos = this.precioEntradasCubiertas();

    return totalEntradas - descuentoCombos + this.subtotalCombos() + this.subtotalCandy();
  });

  public creditoDisponible = computed(() => {
    const usuario = this.usuariosService.obtenerUsuarioActual()();
    return usuario?.creditoDisponible || 0;
  });

  public creditoAplicado = computed(() => {
    if (!this.usarCredito()) {
      return 0;
    }

    return Math.min(this.creditoDisponible(), this.subtotalAntesCredito());
  });

  public totalFinal = computed(() => {
    return Math.max(0, this.subtotalAntesCredito() - this.creditoAplicado());
  });

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

    this.cargarCandy();
  }

  async cargarCandy(): Promise<void> {
    const [categorias, productos, combos] = await Promise.all([
      this.candyService.obtenerCategorias(),
      this.candyService.obtenerProductos(),
      this.comboService.obtenerCombos(),
    ]);

    this.categoriasCandy.set(categorias);
    this.productosCandy.set(productos);
    this.combos.set(combos);

    if (categorias.length > 0) {
      this.categoriaSeleccionada.set(categorias[0].id);
    }
  }

  seleccionarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada.set(categoriaId);
  }

  obtenerCantidad(productoId: string): number {
    return this.cantidadesCandy()[productoId] || 0;
  }

  obtenerCantidadCombo(comboId: string): number {
    return this.cantidadesCombos()[comboId] || 0;
  }

  agregarProducto(producto: ProductoCandy): void {
    const cantidades = { ...this.cantidadesCandy() };
    cantidades[producto.id] = (cantidades[producto.id] || 0) + 1;
    this.cantidadesCandy.set(cantidades);
  }

  quitarProducto(producto: ProductoCandy): void {
    const cantidades = { ...this.cantidadesCandy() };
    const cantidadActual = cantidades[producto.id] || 0;

    if (cantidadActual <= 1) {
      delete cantidades[producto.id];
    } else {
      cantidades[producto.id] = cantidadActual - 1;
    }

    this.cantidadesCandy.set(cantidades);
  }

  agregarCombo(combo: Combo): void {
    const cantidades = { ...this.cantidadesCombos() };
    const cantidadActual = cantidades[combo.id] || 0;
    const entradasActuales = this.entradasCubiertasPorCombos();
    const entradasDisponibles = this.datosReserva?.butacas.length || 0;

    if (entradasActuales + combo.cantidadEntradas > entradasDisponibles) {
      this.abrirModal(
        'Combo no disponible',
        `Este combo incluye ${combo.cantidadEntradas} ${
          combo.cantidadEntradas === 1 ? 'entrada' : 'entradas'
        } y no hay suficientes entradas sin cubrir en esta compra.`,
        'error',
      );
      return;
    }

    cantidades[combo.id] = cantidadActual + 1;
    this.cantidadesCombos.set(cantidades);
  }

  quitarCombo(combo: Combo): void {
    const cantidades = { ...this.cantidadesCombos() };
    const cantidadActual = cantidades[combo.id] || 0;

    if (cantidadActual <= 1) {
      delete cantidades[combo.id];
    } else {
      cantidades[combo.id] = cantidadActual - 1;
    }

    this.cantidadesCombos.set(cantidades);
  }

  alternarCredito(): void {
    if (this.creditoDisponible() <= 0) {
      this.abrirModal(
        'Sin crédito disponible',
        'No tenés crédito disponible para utilizar en esta compra.',
        'error',
      );
      return;
    }

    this.usarCredito.update((valor) => !valor);
  }

  async procesarPago(): Promise<void> {
    if (!this.datosReserva) {
      return;
    }

    if (!this.emailComprador.trim()) {
      this.abrirModal(
        'Email requerido',
        'Ingresá un email válido para recibir tu entrada.',
        'error',
      );
      return;
    }

    this.procesando.set(true);

    try {
      const usuario = this.usuariosService.obtenerUsuarioActual()();
      const usuarioId = usuario ? usuario.id : null;
      const productos = this.productosSeleccionados();
      const combos = this.combosSeleccionados();
      const totalAntesCredito = this.subtotalAntesCredito();
      const creditoAUsar = this.creditoAplicado();

      const resultadoReserva = await this.reservasService.crearReserva(
        this.datosReserva.funcion.id,
        usuarioId,
        this.emailComprador,
        totalAntesCredito,
        this.datosReserva.butacas,
      );

      if (!resultadoReserva.exito) {
        this.abrirModal(
          'Error al procesar la reserva',
          resultadoReserva.mensaje || 'No se pudo completar la reserva.',
          'error',
        );
        return;
      }

      const reservaId = resultadoReserva.reservaId!;

      if (combos.length > 0) {
        const combosGuardados = await this.comboService.agregarCombosAReserva(reservaId, combos);

        if (!combosGuardados) {
          this.abrirModal(
            'Reserva creada con inconvenientes',
            'La reserva fue creada, pero ocurrió un error al guardar los combos.',
            'error',
          );
          return;
        }
      }

      if (productos.length > 0) {
        const candyGuardado = await this.candyService.agregarProductosAReserva(
          reservaId,
          productos,
        );

        if (!candyGuardado) {
          this.abrirModal(
            'Reserva creada con inconvenientes',
            'La reserva fue creada, pero ocurrió un error al guardar los productos Candy.',
            'error',
          );
          return;
        }
      }

      let totalPagado = totalAntesCredito;

      if (creditoAUsar > 0) {
        const resultadoCredito = await this.reservasService.aplicarCreditoAReserva(
          reservaId,
          creditoAUsar,
        );

        if (!resultadoCredito.exito) {
          this.abrirModal(
            'No se pudo aplicar el crédito',
            resultadoCredito.mensaje ||
              'La reserva fue creada, pero no se pudo utilizar el crédito disponible. No se generó el comprobante.',
            'error',
          );
          return;
        }

        totalPagado = resultadoCredito.totalFinal ?? totalAntesCredito;

        this.usuariosService.actualizarCreditoLocal(resultadoCredito.creditoRestante ?? 0);
      }

      await this.pdfService.generarEntradaPdf({
        reservaId,
        pelicula: this.datosReserva.pelicula,
        funcion: this.datosReserva.funcion,
        butacas: this.datosReserva.butacas,
        total: totalPagado,
        emailComprador: this.emailComprador,
        productosCandy: productos,
      });

      if (usuario && usuario.tieneDescuentoPrimeraCompra) {
        await this.usuariosService.usarCuponDescuento();
      }

      this.abrirModal(
        '¡Pago confirmado!',
        'Tu reserva fue guardada correctamente. Se descargó tu comprobante con el código QR.',
        'exito',
      );
    } catch (error) {
      console.error('Error al generar la entrada:', error);
      this.abrirModal(
        'Error al procesar el pago',
        'Ocurrió un error al procesar el pago o generar la entrada.',
        'error',
      );
    } finally {
      this.procesando.set(false);
    }
  }

  abrirModal(titulo: string, mensaje: string, tipo: 'error' | 'exito' = 'error'): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    const eraExito = this.modalTipo === 'exito';
    this.modalAbierto = false;

    if (eraExito) {
      this.router.navigate(['/cartelera']);
    }
  }
}
