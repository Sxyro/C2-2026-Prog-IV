import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { FuncionesService } from '../../../core/services/funciones.service';
import { SalasService } from '../../../core/services/salas.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ReservasService } from '../../../core/services/reservas.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion } from '../../../core/models/funcion.model';
import { Butaca } from '../../../core/models/butaca.model';

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
export class ReservaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private peliculasService = inject(PeliculasService);
  private funcionesService = inject(FuncionesService);
  private salasService = inject(SalasService);
  private usuariosService = inject(UsuariosService);
  private reservasService = inject(ReservasService);
  private configuracionService = inject(ConfiguracionService);

  public configuracion = this.configuracionService.obtenerConfiguracion();

  public pelicula = signal<Pelicula | null>(null);
  public funcionesDisponibles = signal<Funcion[]>([]);
  public funcionSeleccionada = signal<Funcion | null>(null);
  public mapaFilas = signal<FilaMapa[]>([]);
  public butacasSeleccionadas = signal<Butaca[]>([]);
  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  public subtotal = computed(() => {
    const funcion = this.funcionSeleccionada();
    if (!funcion) return 0;
    return this.butacasSeleccionadas().length * funcion.precioEntrada;
  });

  public tieneDescuento = computed(() => {
    const usuario = this.usuarioActual();
    return usuario ? usuario.tieneDescuentoPrimeraCompra : false;
  });

  public total = computed(() => {
    const subtotal = this.subtotal();
    if (!this.tieneDescuento()) return subtotal;

    const porcentaje = this.configuracion().porcentajeDescuentoPrimeraCompra;
    return subtotal * (1 - porcentaje / 100);
  });

  constructor() {
    effect(
      () => {
        const idParam = this.route.snapshot.paramMap.get('idPelicula');
        if (!idParam) return;

        const peliculas = this.peliculasService.obtenerPeliculas()();
        const peliculaEncontrada = peliculas.find((p) => p.id === idParam);

        if (peliculaEncontrada && !this.pelicula()) {
          this.pelicula.set(peliculaEncontrada);
        }

        if (peliculaEncontrada) {
          const todasLasFunciones = this.funcionesService.obtenerFunciones()();
          const funciones = todasLasFunciones.filter((f) => f.peliculaId === peliculaEncontrada.id);

          this.funcionesDisponibles.set(funciones);

          if (funciones.length > 0 && !this.funcionSeleccionada()) {
            this.seleccionarFuncion(funciones[0]);
          }
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {}

  async seleccionarFuncion(funcion: Funcion): Promise<void> {
    this.funcionSeleccionada.set(funcion);
    this.butacasSeleccionadas.set([]);
    await this.generarMapaButacas(funcion);
  }

  private async generarMapaButacas(funcion: Funcion): Promise<void> {
    const idsOcupadas = await this.reservasService.obtenerButacasOcupadas(funcion.id);

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

    for (let i = 0; i < sala.filas; i++) {
      const letra = String.fromCharCode('A'.charCodeAt(0) + i);

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
  }

  toggleButaca(butaca: Butaca): void {
    if (butaca.ocupada) return;

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

  formatearHora(fechaIso: string): string {
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  confirmarReserva(): void {
    if (this.butacasSeleccionadas().length === 0) {
      alert('Por favor, seleccioná al menos una butaca.');
      return;
    }

    const payloadReserva = {
      pelicula: this.pelicula(),
      funcion: this.funcionSeleccionada(),
      butacas: this.butacasSeleccionadas(),
      total: this.total(),
    };

    this.router.navigate(['/checkout'], {
      state: { reserva: payloadReserva },
    });
  }
}
