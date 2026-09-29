import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { FuncionesService } from '../../../core/services/funciones.service';
import { SalasService } from '../../../core/services/salas.service';
import { StaffService } from '../../../core/services/staff.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { GenerosService } from '../../../core/services/generos.service';
import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion } from '../../../core/models/funcion.model';
import { Genero } from '../../../core/models/genero.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  private peliculasService = inject(PeliculasService);
  private funcionesService = inject(FuncionesService);
  private salasService = inject(SalasService);
  private staffService = inject(StaffService);
  private configuracionService = inject(ConfiguracionService);
  private generosService = inject(GenerosService);
  private router = inject(Router);

  public peliculas = this.peliculasService.obtenerPeliculas();
  public funciones = this.funcionesService.obtenerFunciones();
  public salas = this.salasService.obtenerSalas();
  public staffActual = this.staffService.obtenerStaffActual();
  public configuracion = this.configuracionService.obtenerConfiguracion();

  public generos: Genero[] = [];
  public generosSeleccionados: string[] = [];

  public porcentajeDescuentoForm = 20;
  public guardandoDescuento = signal(false);
  public mensajeDescuentoGuardado = signal<string | null>(null);
  public porcentajeDescuentoMayores50Form = 30;
  public guardandoDescuentoMayores50 = signal(false);
  public mensajeDescuentoMayores50Guardado = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.porcentajeDescuentoForm = this.configuracion().porcentajeDescuentoPrimeraCompra;

      this.porcentajeDescuentoMayores50Form = this.configuracion().porcentajeDescuentoMayores50;
    });
  }

  public nuevaPelicula: Omit<Pelicula, 'id'> = {
    nombre: '',
    sinopsis: '',
    portadaUrl: '',
    duracionMinutos: 120,
    formato: '2D',
    idioma: 'Subtitulada',
  };

  public nuevaFuncion = {
    peliculaId: '',
    salaId: 'sala-1',
    fechaHoraInicio: '',
    precioEntrada: 4500,
  };

  async ngOnInit(): Promise<void> {
    await this.peliculasService.cargarPeliculas(false);
    this.generos = await this.generosService.obtenerGeneros();
  }

  async cerrarSesionStaff(): Promise<void> {
    await this.staffService.cerrarSesion();
    this.router.navigate(['/admin/login']);
  }

  async guardarPorcentajeDescuento(): Promise<void> {
    this.guardandoDescuento.set(true);
    this.mensajeDescuentoGuardado.set(null);

    const exito = await this.configuracionService.actualizarPorcentajeDescuento(
      this.porcentajeDescuentoForm,
    );

    this.guardandoDescuento.set(false);

    this.mensajeDescuentoGuardado.set(
      exito ? 'Porcentaje actualizado correctamente.' : 'No se pudo guardar el cambio.',
    );
  }

  async guardarPorcentajeMayores50(): Promise<void> {
    this.guardandoDescuentoMayores50.set(true);
    this.mensajeDescuentoMayores50Guardado.set(null);

    const exito = await this.configuracionService.actualizarPorcentajeMayores50(
      this.porcentajeDescuentoMayores50Form,
    );

    this.guardandoDescuentoMayores50.set(false);

    this.mensajeDescuentoMayores50Guardado.set(
      exito
        ? 'Descuento para mayores de 50 actualizado correctamente.'
        : 'No se pudo guardar el cambio.',
    );
  }

  async toggleVisibilidad(pelicula: Pelicula): Promise<void> {
    const nuevoEstado = !(pelicula.publicada ?? true);

    const ok = await this.peliculasService.cambiarEstadoPublicacion(pelicula.id, nuevoEstado);

    if (!ok) {
      alert('Error al actualizar la visibilidad de la película.');
    } else {
      await this.peliculasService.cargarPeliculas(false);
    }
  }

  toggleGenero(generoId: string): void {
    if (this.generosSeleccionados.includes(generoId)) {
      this.generosSeleccionados = this.generosSeleccionados.filter((id) => id !== generoId);
    } else {
      this.generosSeleccionados = [...this.generosSeleccionados, generoId];
    }
  }

  async guardarPelicula(): Promise<void> {
    if (!this.nuevaPelicula.nombre.trim() || this.nuevaPelicula.duracionMinutos <= 0) {
      alert('Por favor completá los campos obligatorios de la película.');
      return;
    }

    if (this.generosSeleccionados.length === 0) {
      alert('Seleccioná al menos un género para la película.');
      return;
    }

    const idsNumericos = this.peliculas()
      .map((p) => parseInt(p.id, 10))
      .filter((id) => !isNaN(id));

    const siguienteId = idsNumericos.length > 0 ? (Math.max(...idsNumericos) + 1).toString() : '1';

    const peliculaACrear: Pelicula = {
      id: siguienteId,
      ...this.nuevaPelicula,
    };

    const OK = await this.peliculasService.agregarPelicula(
      peliculaACrear,
      this.generosSeleccionados,
    );

    if (!OK) {
      alert('Error al guardar la película en la base de datos.');
      return;
    }

    alert('¡Película agregada con éxito!');

    this.nuevaPelicula = {
      nombre: '',
      sinopsis: '',
      portadaUrl: '',
      duracionMinutos: 120,
      formato: '2D',
      idioma: 'Subtitulada',
    };

    this.generosSeleccionados = [];

    await this.peliculasService.cargarPeliculas(false);
  }

  async guardarFuncion(): Promise<void> {
    if (!this.nuevaFuncion.peliculaId || !this.nuevaFuncion.fechaHoraInicio) {
      alert('Seleccioná una película y un horario válido.');
      return;
    }

    if (this.nuevaFuncion.precioEntrada <= 0) {
      alert('El precio debe ser mayor a cero.');
      return;
    }

    const pelicula = this.peliculas().find((p) => p.id === this.nuevaFuncion.peliculaId);

    if (!pelicula) {
      alert('Película no encontrada.');
      return;
    }

    const fechaInicio = new Date(this.nuevaFuncion.fechaHoraInicio);

    const fechaFin = new Date(fechaInicio.getTime() + pelicula.duracionMinutos * 60000);

    const funcionACrear: Funcion = {
      id: 'f_' + Date.now(),
      peliculaId: this.nuevaFuncion.peliculaId,
      salaId: this.nuevaFuncion.salaId,
      fechaHoraInicio: fechaInicio.toISOString(),
      fechaHoraFin: fechaFin.toISOString(),
      precioEntrada: this.nuevaFuncion.precioEntrada,
    };

    const resultado = await this.funcionesService.agregarFuncion(funcionACrear);

    if (!resultado.exito) {
      alert(`ERROR: ${resultado.mensaje}`);
      return;
    }

    alert('¡Función programada correctamente!');

    this.nuevaFuncion = {
      peliculaId: '',
      salaId: 'sala-1',
      fechaHoraInicio: '',
      precioEntrada: 4500,
    };
  }

  obtenerPelicula(peliculaId: string): Pelicula | undefined {
    return this.peliculas().find((pelicula) => pelicula.id === peliculaId);
  }

  obtenerSala(salaId: string) {
    return this.salas().find((sala) => sala.id === salaId);
  }
}
