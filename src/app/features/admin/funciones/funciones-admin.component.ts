import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { FuncionesService } from '../../../core/services/funciones.service';
import { SalasService } from '../../../core/services/salas.service';
import { Pelicula } from '../../../core/models/pelicula.model';
import { Funcion } from '../../../core/models/funcion.model';
import { RouterLink } from '@angular/router';

interface DiaCalendario {
  fecha: Date;
  numero: number;
  esDelMesActual: boolean;
  esHoy: boolean;
  esSeleccionado: boolean;
  esAnterior: boolean;
}

@Component({
  selector: 'app-funciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './funciones-admin.component.html',
  styleUrl: './funciones-admin.component.css',
})
export class FuncionesAdminComponent implements OnInit {
  private peliculasService = inject(PeliculasService);
  private funcionesService = inject(FuncionesService);
  private salasService = inject(SalasService);

  public peliculas = this.peliculasService.obtenerPeliculas();
  public funciones = this.funcionesService.obtenerFunciones();
  public salas = this.salasService.obtenerSalas();

  public nuevaFuncion = {
    peliculaId: '',
    fecha: '',
    hora: '',
    precioEntrada: 15000,
  };

  public calendarioAbierto = false;
  public selectorHoraAbierto = false;

  public mesCalendario = new Date().getMonth();
  public anioCalendario = new Date().getFullYear();

  public horasDisponibles: string[] = [];

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  private diasSemana = [
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
    'Dom',
  ];

  async ngOnInit(): Promise<void> {
    await this.peliculasService.cargarPeliculas();
    await this.funcionesService.cargarFunciones();
    await this.salasService.cargarSalas();

    this.generarHorasDisponibles();
  }

  private generarHorasDisponibles(): void {
    const horas: string[] = [];

    for (let hora = 10; hora <= 23; hora++) {
      horas.push(`${hora.toString().padStart(2, '0')}:00`);
      horas.push(`${hora.toString().padStart(2, '0')}:30`);
    }

    this.horasDisponibles = horas;
  }

  obtenerNombreMes(): string {
    const fecha = new Date(
      this.anioCalendario,
      this.mesCalendario,
      1
    );

    return fecha
      .toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric',
      })
      .replace(/^./, letra => letra.toUpperCase());
  }

  obtenerDiasCalendario(): DiaCalendario[] {
    const primerDia = new Date(
      this.anioCalendario,
      this.mesCalendario,
      1
    );

    const ultimoDia = new Date(
      this.anioCalendario,
      this.mesCalendario + 1,
      0
    );

    let primerDiaSemana = primerDia.getDay();

    if (primerDiaSemana === 0) {
      primerDiaSemana = 7;
    }

    const dias: DiaCalendario[] = [];

    const diasAnteriores = primerDiaSemana - 1;

    for (let i = diasAnteriores; i > 0; i--) {
      const fecha = new Date(
        this.anioCalendario,
        this.mesCalendario,
        1 - i
      );

      dias.push(this.crearDiaCalendario(fecha, false));
    }

    for (
      let numero = 1;
      numero <= ultimoDia.getDate();
      numero++
    ) {
      const fecha = new Date(
        this.anioCalendario,
        this.mesCalendario,
        numero
      );

      dias.push(this.crearDiaCalendario(fecha, true));
    }

    const diasRestantes = 42 - dias.length;

    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(
        this.anioCalendario,
        this.mesCalendario + 1,
        i
      );

      dias.push(this.crearDiaCalendario(fecha, false));
    }

    return dias;
  }

  private crearDiaCalendario(
    fecha: Date,
    esDelMesActual: boolean
  ): DiaCalendario {
    const hoy = new Date();

    const fechaSinHora = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    );

    const hoySinHora = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );

    return {
      fecha,
      numero: fecha.getDate(),
      esDelMesActual,
      esHoy:
        fechaSinHora.getTime() ===
        hoySinHora.getTime(),
      esSeleccionado:
        this.nuevaFuncion.fecha ===
        this.formatearFecha(fecha),
      esAnterior:
        fechaSinHora.getTime() <
        hoySinHora.getTime(),
    };
  }

  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const dia = fecha.getDate()
      .toString()
      .padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  obtenerFechaFormateada(): string {
    if (!this.nuevaFuncion.fecha) {
      return 'Seleccionar fecha';
    }

    const [anio, mes, dia] =
      this.nuevaFuncion.fecha.split('-');

    return `${dia}/${mes}/${anio}`;
  }

  seleccionarFecha(dia: DiaCalendario): void {
    if (dia.esAnterior) {
      return;
    }

    this.nuevaFuncion.fecha =
      this.formatearFecha(dia.fecha);

    this.calendarioAbierto = false;
  }

  abrirCalendario(): void {
    this.selectorHoraAbierto = false;
    this.calendarioAbierto =
      !this.calendarioAbierto;
  }

  abrirSelectorHora(): void {
    this.calendarioAbierto = false;
    this.selectorHoraAbierto =
      !this.selectorHoraAbierto;
  }

  seleccionarHora(hora: string): void {
    this.nuevaFuncion.hora = hora;
    this.selectorHoraAbierto = false;
  }

  obtenerHoraFormateada(): string {
    return this.nuevaFuncion.hora || 'Seleccionar hora';
  }

  mesAnterior(): void {
    if (this.mesCalendario === 0) {
      this.mesCalendario = 11;
      this.anioCalendario--;
    } else {
      this.mesCalendario--;
    }
  }

  mesSiguiente(): void {
    if (this.mesCalendario === 11) {
      this.mesCalendario = 0;
      this.anioCalendario++;
    } else {
      this.mesCalendario++;
    }
  }

  volverAlMesActual(): void {
    const hoy = new Date();

    this.mesCalendario =
      hoy.getMonth();

    this.anioCalendario =
      hoy.getFullYear();
  }

  abrirModal(
    titulo: string,
    mensaje: string,
    tipo: 'error' | 'exito' = 'error'
  ): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  async guardarFuncion(): Promise<void> {
    if (
      !this.nuevaFuncion.peliculaId ||
      !this.nuevaFuncion.fecha ||
      !this.nuevaFuncion.hora
    ) {
      this.abrirModal(
        'Datos incompletos',
        'Seleccioná una película, una fecha y un horario válido.'
      );
      return;
    }

    if (this.nuevaFuncion.precioEntrada <= 0) {
      this.abrirModal(
        'Precio inválido',
        'El precio debe ser mayor a cero.'
      );
      return;
    }

    const pelicula =
      this.peliculas().find(
        p =>
          p.id ===
          this.nuevaFuncion.peliculaId
      );

    if (!pelicula) {
      this.abrirModal(
        'Película no encontrada',
        'No se pudo encontrar la película seleccionada.'
      );
      return;
    }

    const fechaInicio = new Date(
      `${this.nuevaFuncion.fecha}T${this.nuevaFuncion.hora}:00`
    );

    if (isNaN(fechaInicio.getTime())) {
      this.abrirModal(
        'Fecha inválida',
        'La fecha u hora seleccionada no es válida.'
      );
      return;
    }

    const fechaFin = new Date(
      fechaInicio.getTime() +
        pelicula.duracionMinutos * 60000
    );

    const funcionACrear: Funcion = {
      id: 'f_' + Date.now(),
      peliculaId:
        this.nuevaFuncion.peliculaId,
      salaId: '',
      fechaHoraInicio:
        fechaInicio.toISOString(),
      fechaHoraFin:
        fechaFin.toISOString(),
      precioEntrada:
        this.nuevaFuncion.precioEntrada,
    };

    const resultado =
      await this.funcionesService.agregarFuncion(
        funcionACrear
      );

    if (!resultado.exito) {
      this.abrirModal(
        'No se pudo crear la función',
        resultado.mensaje
      );
      return;
    }

    this.abrirModal(
      'Función creada',
      resultado.mensaje,
      'exito'
    );

    this.nuevaFuncion = {
      peliculaId: '',
      fecha: '',
      hora: '',
      precioEntrada: 15000,
    };

    await this.funcionesService.cargarFunciones();
  }

  obtenerPelicula(
    peliculaId: string
  ): Pelicula | undefined {
    return this.peliculas().find(
      pelicula =>
        pelicula.id === peliculaId
    );
  }

  obtenerSala(salaId: string) {
    return this.salas().find(
      sala => sala.id === salaId
    );
  }

  obtenerDiasSemana(): string[] {
    return this.diasSemana;
  }
}
