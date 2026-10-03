import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { FuncionesService } from '../../../core/services/funciones.service';
import { SalasService } from '../../../core/services/salas.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion, RECARGO_BUTACA_VIP } from '../../../core/models/funcion.model';
import { Butaca } from '../../../core/models/butaca.model';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface FilaMapa {
  letra: string;
  butacas: Butaca[];
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.css',
})
export class ReservaComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private peliculasService = inject(PeliculasService);
  private funcionesService = inject(FuncionesService);
  private salasService = inject(SalasService);
  private usuariosService = inject(UsuariosService);
  private reservasService = inject(ReservasService);
  private configuracionService = inject(ConfiguracionService);

  private canalButacas: RealtimeChannel | null = null;

  public configuracion = this.configuracionService.obtenerConfiguracion();

  public pelicula = signal<Pelicula | null>(null);
  public funcionesDisponibles = signal<Funcion[]>([]);
  public funcionSeleccionada = signal<Funcion | null>(null);
  public mapaFilas = signal<FilaMapa[]>([]);
  public butacasSeleccionadas = signal<Butaca[]>([]);
  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';
  public modalConfirmacion = false;
  public accionConfirmacion: (() => void) | null = null;

  public estaEnPreventa = computed(() => {
    const pelicula = this.pelicula();

    if (!pelicula?.fechaEstreno) {
      return false;
    }

    const ahora = Date.now();
    const estreno = new Date(`${pelicula.fechaEstreno}T00:00:00`).getTime();
    const inicioPreventa = estreno - 7 * 24 * 60 * 60 * 1000;

    return ahora >= inicioPreventa && ahora < estreno;
  });

  public precioEntradaAplicado = computed(() => {
    const funcion = this.funcionSeleccionada();
    const pelicula = this.pelicula();

    if (!funcion) {
      return 0;
    }

    if (
      this.estaEnPreventa() &&
      pelicula?.precioPreventa !== null &&
      pelicula?.precioPreventa !== undefined &&
      pelicula.precioPreventa > 0
    ) {
      return pelicula.precioPreventa;
    }

    return funcion.precioEntrada;
  });

  public precioButaca(butaca: Butaca): number {
    return this.precioEntradaAplicado() + (butaca.vip ? RECARGO_BUTACA_VIP : 0);
  }

  public cantidadButacasVip = computed(() => {
    return this.butacasSeleccionadas().filter((butaca) => butaca.vip).length;
  });

  public subtotal = computed(() => {
    return this.butacasSeleccionadas().reduce(
      (total, butaca) => total + this.precioButaca(butaca),
      0,
    );
  });

  public tieneDescuento = computed(() => {
    const usuario = this.usuarioActual();

    return usuario ? usuario.tieneDescuentoPrimeraCompra : false;
  });

  public esMayorDe50 = computed(() => {
    const usuario = this.usuarioActual();

    if (!usuario) {
      return false;
    }

    const fechaNacimiento = new Date(usuario.fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

    const mesActual = hoy.getMonth();
    const mesNacimiento = fechaNacimiento.getMonth();

    if (
      mesActual < mesNacimiento ||
      (mesActual === mesNacimiento && hoy.getDate() < fechaNacimiento.getDate())
    ) {
      edad--;
    }

    return edad >= 50;
  });

  public total = computed(() => {
    let total = this.subtotal();

    if (this.esMayorDe50()) {
      const porcentajeMayores50 = this.configuracion().porcentajeDescuentoMayores50;
      total = total * (1 - porcentajeMayores50 / 100);
    }

    if (this.tieneDescuento()) {
      const porcentajePrimeraCompra = this.configuracion().porcentajeDescuentoPrimeraCompra;
      total = total * (1 - porcentajePrimeraCompra / 100);
    }

    return total;
  });

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.paramMap.get('idPelicula');

      if (!idParam) {
        return;
      }

      const peliculaActual = this.pelicula();

      if (!peliculaActual) {
        void this.cargarPelicula(idParam);
        return;
      }

      const todasLasFunciones = this.funcionesService.obtenerFunciones()();

      const funciones = todasLasFunciones.filter(
        (funcion) => funcion.peliculaId === peliculaActual.id,
      );

      this.funcionesDisponibles.set(funciones);

      if (funciones.length > 0 && !this.funcionSeleccionada()) {
        void this.seleccionarFuncion(funciones[0]);
      }
    });
  }

  async cargarPelicula(peliculaId: string): Promise<void> {
    const pelicula = await this.peliculasService.obtenerPeliculaPorId(peliculaId);

    if (!pelicula) {
      this.abrirModal(
        'Película no disponible',
        'La película no está disponible para la compra en este momento.',
        'error',
      );

      return;
    }

    if (!pelicula.fechaEstreno) {
      this.pelicula.set(pelicula);
      return;
    }

    const estreno = new Date(`${pelicula.fechaEstreno}T00:00:00`).getTime();
    const inicioPreventa = estreno - 7 * 24 * 60 * 60 * 1000;

    if (Date.now() < inicioPreventa) {
      this.abrirModal(
        'Preventa todavía no disponible',
        `La preventa comienza el ${this.formatearFecha(new Date(inicioPreventa).toISOString())}.`,
        'error',
      );

      return;
    }

    this.pelicula.set(pelicula);

    await this.funcionesService.cargarFunciones();
  }

  ngOnInit(): void {}

  async ngOnDestroy(): Promise<void> {
    await this.desuscribirseButacas();
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatearSala(salaId: string): string {
    return salaId.replace('-', ' ').replace(/^sala/, 'Sala');
  }

  async seleccionarFuncion(funcion: Funcion): Promise<void> {
    await this.desuscribirseButacas();

    this.funcionSeleccionada.set(funcion);
    this.butacasSeleccionadas.set([]);

    await this.generarMapaButacas(funcion);

    this.suscribirseButacas(funcion.id);
  }

  private async generarMapaButacas(funcion: Funcion): Promise<void> {
    const idsOcupadas = await this.reservasService.obtenerButacasOcupadas(funcion.id);

    await this.actualizarMapaOcupacion(idsOcupadas);
  }

  private async actualizarMapaOcupacion(idsOcupadas: string[]): Promise<void> {
    const funcion = this.funcionSeleccionada();

    if (!funcion) {
      return;
    }

    let salasDisponibles = this.salasService.obtenerSalas()();

    if (salasDisponibles.length === 0) {
      salasDisponibles = await this.salasService.cargarSalas();
    }

    const sala = salasDisponibles.find((s) => s.id === funcion.salaId);

    if (!sala) {
      this.mapaFilas.set([]);
      return;
    }

    const todasLasButacas = this.salasService.generarMapaButacas(sala.filas);
    const filas: FilaMapa[] = [];
    const letras = [...new Set(todasLasButacas.map((butaca) => butaca.fila))];

    for (const letra of letras) {
      const butacasFila = todasLasButacas
        .filter((butaca) => butaca.fila === letra)
        .map((butaca) => ({
          ...butaca,
          ocupada: idsOcupadas.includes(butaca.id),
        }));

      filas.push({
        letra,
        butacas: butacasFila,
      });
    }

    this.mapaFilas.set(filas);

    const seleccionadas = this.butacasSeleccionadas();

    const ocupadasSeleccionadas = seleccionadas.filter((butaca) => idsOcupadas.includes(butaca.id));

    if (ocupadasSeleccionadas.length > 0) {
      const idsPerdidos = ocupadasSeleccionadas.map((butaca) => butaca.id);

      this.butacasSeleccionadas.set(
        seleccionadas.filter((butaca) => !idsPerdidos.includes(butaca.id)),
      );

      this.abrirModal(
        'Butaca ocupada',
        'Una de las butacas que habías seleccionado fue ocupada por otra persona. La selección fue actualizada automáticamente.',
        'error',
      );
    }
  }

  private suscribirseButacas(funcionId: string): void {
    this.canalButacas = this.reservasService.suscribirseCambiosButacas(
      funcionId,
      async (evento, butacaId) => {
        const filasActuales = this.mapaFilas();

        if (evento === 'INSERT') {
          const nuevasFilas = filasActuales.map((fila) => ({
            ...fila,
            butacas: fila.butacas.map((butaca) =>
              butaca.id === butacaId
                ? {
                    ...butaca,
                    ocupada: true,
                  }
                : butaca,
            ),
          }));

          this.mapaFilas.set(nuevasFilas);

          const seleccionadas = this.butacasSeleccionadas();
          const estabaSeleccionada = seleccionadas.some((butaca) => butaca.id === butacaId);

          if (estabaSeleccionada) {
            this.butacasSeleccionadas.set(seleccionadas.filter((butaca) => butaca.id !== butacaId));

            this.abrirModal(
              'Butaca ocupada',
              `La butaca ${butacaId} acaba de ser ocupada por otra persona y fue retirada de tu selección.`,
              'error',
            );
          }
        }

        if (evento === 'DELETE') {
          const nuevasFilas = filasActuales.map((fila) => ({
            ...fila,
            butacas: fila.butacas.map((butaca) =>
              butaca.id === butacaId
                ? {
                    ...butaca,
                    ocupada: false,
                  }
                : butaca,
            ),
          }));

          this.mapaFilas.set(nuevasFilas);
        }
      },
    );
  }

  private async desuscribirseButacas(): Promise<void> {
    if (!this.canalButacas) {
      return;
    }

    await this.reservasService.cancelarSuscripcionButacas(this.canalButacas);

    this.canalButacas = null;
  }

  toggleButaca(butaca: Butaca): void {
    if (butaca.ocupada) {
      return;
    }

    const actuales = this.butacasSeleccionadas();
    const index = actuales.findIndex((b) => b.id === butaca.id);

    if (index >= 0) {
      this.butacasSeleccionadas.set(actuales.filter((b) => b.id !== butaca.id));
    } else {
      this.butacasSeleccionadas.set([...actuales, butaca]);
    }
  }

  esButacaSeleccionada(butaca: Butaca): boolean {
    return this.butacasSeleccionadas().some((b) => b.id === butaca.id);
  }

  private calcularEdad(fechaNacimiento: string, fechaReferencia: string): number {
    const nacimiento = new Date(fechaNacimiento);
    const referencia = new Date(fechaReferencia);

    let edad = referencia.getFullYear() - nacimiento.getFullYear();

    const mesReferencia = referencia.getMonth();
    const mesNacimiento = nacimiento.getMonth();

    if (
      mesReferencia < mesNacimiento ||
      (mesReferencia === mesNacimiento && referencia.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  }

  private verificarRestriccionEdad(): boolean {
    const pelicula = this.pelicula();
    const funcion = this.funcionSeleccionada();

    if (!pelicula || !funcion) {
      return false;
    }

    if (pelicula.clasificacionEdad === 'ATP') {
      return true;
    }

    const usuario = this.usuarioActual();

    if (!usuario) {
      this.abrirModal(
        'Inicio de sesión requerido',
        `Esta película tiene clasificación ${pelicula.clasificacionEdad}. Para comprar entradas necesitás iniciar sesión.`,
        'error',
      );

      this.accionConfirmacion = () => {
        this.cerrarModal();
        this.router.navigate(['/login']);
      };

      this.modalConfirmacion = true;

      return false;
    }

    const edad = this.calcularEdad(usuario.fechaNacimiento, funcion.fechaHoraInicio);

    if (pelicula.clasificacionEdad === '+18' && edad < 18) {
      this.abrirModal(
        'Acceso restringido',
        'No podés comprar entradas para esta película porque es apta para mayores de 18 años.',
        'error',
      );

      return false;
    }

    if (pelicula.clasificacionEdad === '+13' && edad < 13) {
      this.abrirModal(
        'Acceso restringido',
        'No podés comprar entradas para esta película porque es apta para mayores de 13 años.',
        'error',
      );

      return false;
    }

    if (pelicula.clasificacionEdad === '+13' && edad >= 13 && edad < 18) {
      this.abrirModal(
        'Película +13',
        'Los menores de 18 años deben asistir acompañados por un adulto responsable. ¿Querés continuar con la compra?',
        'error',
      );

      this.modalConfirmacion = true;

      this.accionConfirmacion = () => {
        this.cerrarModal();

        const payloadReserva = {
          pelicula: this.pelicula(),
          funcion: this.funcionSeleccionada(),
          butacas: this.butacasSeleccionadas(),
          total: this.total(),
        };

        this.router.navigate(['/checkout'], {
          state: {
            reserva: payloadReserva,
          },
        });
      };

      return false;
    }

    return true;
  }

  confirmarReserva(): void {
    if (this.butacasSeleccionadas().length === 0) {
      this.abrirModal(
        'Seleccioná una butaca',
        'Por favor, seleccioná al menos una butaca antes de continuar.',
        'error',
      );

      return;
    }

    if (!this.pelicula()) {
      return;
    }

    if (this.funcionesDisponibles().length === 0) {
      this.abrirModal(
        'Entradas no disponibles',
        'Todavía no hay funciones disponibles para esta película.',
        'error',
      );

      return;
    }

    if (!this.verificarRestriccionEdad()) {
      return;
    }

    const payloadReserva = {
      pelicula: this.pelicula(),
      funcion: this.funcionSeleccionada(),
      butacas: this.butacasSeleccionadas(),
      total: this.total(),
    };

    this.router.navigate(['/checkout'], {
      state: {
        reserva: payloadReserva,
      },
    });
  }

  abrirModal(titulo: string, mensaje: string, tipo: 'error' | 'exito' = 'error'): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
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
}
