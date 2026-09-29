import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PdfService } from '../../../core/services/pdf.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { CandyService } from '../../../core/services/candy.service';

import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion } from '../../../core/models/funcion.model';
import { Butaca } from '../../../core/models/butaca.model';
import {
  CategoriaCandy,
  ProductoCandy,
  ProductoCandySeleccionado,
} from '../../../core/models/producto-candy.model';

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
  private router = inject(Router);

  public datosReserva: DatosReserva | null = null;
  public emailComprador = '';
  public procesando = signal(false);

  public categoriasCandy = signal<CategoriaCandy[]>([]);
  public productosCandy = signal<ProductoCandy[]>([]);
  public categoriaSeleccionada = signal<string>('');
  public cantidadesCandy = signal<Record<string, number>>({});

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

  public subtotalCandy = computed(() => {
    return this.productosSeleccionados().reduce((total, item) => total + item.subtotal, 0);
  });

  public totalFinal = computed(() => {
    return (this.datosReserva?.total || 0) + this.subtotalCandy();
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
    const [categorias, productos] = await Promise.all([
      this.candyService.obtenerCategorias(),
      this.candyService.obtenerProductos(),
    ]);

    this.categoriasCandy.set(categorias);
    this.productosCandy.set(productos);

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

  agregarProducto(producto: ProductoCandy): void {
    const cantidades = {
      ...this.cantidadesCandy(),
    };

    cantidades[producto.id] = (cantidades[producto.id] || 0) + 1;

    this.cantidadesCandy.set(cantidades);
  }

  quitarProducto(producto: ProductoCandy): void {
    const cantidades = {
      ...this.cantidadesCandy(),
    };

    const cantidadActual = cantidades[producto.id] || 0;

    if (cantidadActual <= 1) {
      delete cantidades[producto.id];
    } else {
      cantidades[producto.id] = cantidadActual - 1;
    }

    this.cantidadesCandy.set(cantidades);
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

      const productos = this.productosSeleccionados();

      const resultadoReserva = await this.reservasService.crearReserva(
        this.datosReserva.funcion.id,
        usuarioId,
        this.emailComprador,
        this.totalFinal(),
        this.datosReserva.butacas,
      );

      if (!resultadoReserva.exito) {
        alert(`Error al procesar la reserva: ${resultadoReserva.mensaje}`);
        return;
      }

      const reservaId = resultadoReserva.reservaId!;

      if (productos.length > 0) {
        const candyGuardado = await this.candyService.agregarProductosAReserva(
          reservaId,
          productos,
        );

        if (!candyGuardado) {
          alert('La reserva fue creada, pero ocurrió un error al guardar los productos Candy.');
          return;
        }
      }

      await this.pdfService.generarEntradaPdf({
        reservaId,
        pelicula: this.datosReserva.pelicula,
        funcion: this.datosReserva.funcion,
        butacas: this.datosReserva.butacas,
        total: this.totalFinal(),
        emailComprador: this.emailComprador,
        productosCandy: productos,
      });

      if (usuario && usuario.tieneDescuentoPrimeraCompra) {
        await this.usuariosService.usarCuponDescuento();
      }

      alert(
        '¡Pago confirmado! Se ha guardado tu reserva, tus productos Candy y descargado tu comprobante con el código QR.',
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
