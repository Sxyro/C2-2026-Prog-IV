import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CandyMasVendido,
  LogActividad,
  PeliculaMasVista,
  ReporteDiario,
  ResumenFinanciero,
} from '../../../core/models/reportes.model';
import { ReportesService } from '../../../core/services/reportes.service';
import { ExportacionReportesService } from '../../../core/services/exportacion-reportes.service';

interface DiaReporte {
  fecha: Date;
  numero: number;
  esDelMesActual: boolean;
  esHoy: boolean;
  esSeleccionado: boolean;
  esFuturo: boolean;
}

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reportes-admin.component.html',
  styleUrl: './reportes-admin.component.css',
})
export class ReportesAdminComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private cdr = inject(ChangeDetectorRef);
  private exportacionService = inject(ExportacionReportesService);

  resumen: ResumenFinanciero | null = null;

  peliculasSemanales: PeliculaMasVista[] = [];
  peliculasMensuales: PeliculaMasVista[] = [];

  candyMasVendido: CandyMasVendido[] = [];

  reporteDiario: ReporteDiario | null = null;

  logActividad: LogActividad[] = [];

  fechaSeleccionada = this.obtenerFechaActual();

  cargando = true;

  calendarioAbierto = false;
  selectorAnioAbierto = false;

  mesCalendario = new Date().getMonth();
  anioCalendario = new Date().getFullYear();

  aniosDisponibles: number[] = [];

  private diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  constructor() {
    this.generarAniosDisponibles();
  }

  async ngOnInit(): Promise<void> {
    await this.cargarReportes();
  }

  async cargarReportes(): Promise<void> {
    this.cargando = true;
    this.cdr.detectChanges();

    const [
      resumen,
      peliculasSemanales,
      peliculasMensuales,
      candyMasVendido,
      reporteDiario,
      logActividad,
    ] = await Promise.all([
      this.reportesService.obtenerResumenFinanciero(),
      this.reportesService.obtenerPeliculasMasVistas('semanal'),
      this.reportesService.obtenerPeliculasMasVistas('mensual'),
      this.reportesService.obtenerCandyMasVendido(),
      this.reportesService.obtenerReporteDiario(this.fechaSeleccionada),
      this.reportesService.obtenerLogActividad(),
    ]);

    this.resumen = resumen;
    this.peliculasSemanales = peliculasSemanales;
    this.peliculasMensuales = peliculasMensuales;
    this.candyMasVendido = candyMasVendido;
    this.reporteDiario = reporteDiario;
    this.logActividad = logActividad;

    this.cargando = false;
    this.cdr.detectChanges();
  }

  async seleccionarFecha(dia: DiaReporte): Promise<void> {
    if (dia.esFuturo) {
      return;
    }

    this.fechaSeleccionada = this.formatearFecha(dia.fecha);

    this.calendarioAbierto = false;
    this.selectorAnioAbierto = false;

    this.reporteDiario = await this.reportesService.obtenerReporteDiario(this.fechaSeleccionada);

    this.cdr.detectChanges();
  }

  abrirCalendario(): void {
    this.selectorAnioAbierto = false;
    this.calendarioAbierto = !this.calendarioAbierto;

    if (this.calendarioAbierto) {
      const partes = this.fechaSeleccionada.split('-');

      this.anioCalendario = Number(partes[0]);
      this.mesCalendario = Number(partes[1]) - 1;
    }
  }

  generarAniosDisponibles(): void {
    const anioActual = new Date().getFullYear();

    for (let anio = anioActual; anio >= 1900; anio--) {
      this.aniosDisponibles.push(anio);
    }
  }

  obtenerNombreMes(): string {
    const fecha = new Date(this.anioCalendario, this.mesCalendario, 1);

    return fecha
      .toLocaleDateString('es-AR', {
        month: 'long',
      })
      .replace(/^./, (letra) => letra.toUpperCase());
  }

  obtenerDiasCalendario(): DiaReporte[] {
    const primerDia = new Date(this.anioCalendario, this.mesCalendario, 1);

    const ultimoDia = new Date(this.anioCalendario, this.mesCalendario + 1, 0);

    let primerDiaSemana = primerDia.getDay();

    if (primerDiaSemana === 0) {
      primerDiaSemana = 7;
    }

    const dias: DiaReporte[] = [];

    const diasAnteriores = primerDiaSemana - 1;

    for (let i = diasAnteriores; i > 0; i--) {
      const fecha = new Date(this.anioCalendario, this.mesCalendario, 1 - i);

      dias.push(this.crearDiaCalendario(fecha, false));
    }

    for (let numero = 1; numero <= ultimoDia.getDate(); numero++) {
      const fecha = new Date(this.anioCalendario, this.mesCalendario, numero);

      dias.push(this.crearDiaCalendario(fecha, true));
    }

    const diasRestantes = 42 - dias.length;

    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(this.anioCalendario, this.mesCalendario + 1, i);

      dias.push(this.crearDiaCalendario(fecha, false));
    }

    return dias;
  }

  private crearDiaCalendario(fecha: Date, esDelMesActual: boolean): DiaReporte {
    const hoy = new Date();

    const fechaSinHora = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    return {
      fecha,
      numero: fecha.getDate(),
      esDelMesActual,
      esHoy: fechaSinHora.getTime() === hoySinHora.getTime(),
      esSeleccionado: this.fechaSeleccionada === this.formatearFecha(fecha),
      esFuturo: fechaSinHora.getTime() > hoySinHora.getTime(),
    };
  }

  obtenerFechaFormateada(): string {
    const [anio, mes, dia] = this.fechaSeleccionada.split('-');

    return `${dia}/${mes}/${anio}`;
  }

  formatearFecha(fecha: Date | string): string {
    const fechaConvertida = typeof fecha === 'string' ? new Date(fecha) : fecha;

    const anio = fechaConvertida.getFullYear();
    const mes = String(fechaConvertida.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaConvertida.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
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
    const hoy = new Date();

    const siguienteMes = this.mesCalendario === 11 ? 0 : this.mesCalendario + 1;

    const siguienteAnio = this.mesCalendario === 11 ? this.anioCalendario + 1 : this.anioCalendario;

    if (
      siguienteAnio > hoy.getFullYear() ||
      (siguienteAnio === hoy.getFullYear() && siguienteMes > hoy.getMonth())
    ) {
      return;
    }

    this.mesCalendario = siguienteMes;
    this.anioCalendario = siguienteAnio;
  }

  esMesActual(): boolean {
    const hoy = new Date();

    return this.anioCalendario === hoy.getFullYear() && this.mesCalendario === hoy.getMonth();
  }

  volverAlMesActual(): void {
    const hoy = new Date();

    this.anioCalendario = hoy.getFullYear();
    this.mesCalendario = hoy.getMonth();
  }

  abrirSelectorAnio(): void {
    this.selectorAnioAbierto = !this.selectorAnioAbierto;
  }

  seleccionarAnio(anio: number): void {
    this.anioCalendario = anio;
    this.selectorAnioAbierto = false;
  }

  obtenerDiasSemana(): string[] {
    return this.diasSemana;
  }

  obtenerFechaActual(): string {
    const ahora = new Date();

    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  formatearFechaHora(fecha: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fecha));
  }

  obtenerPorcentaje(valor: number, lista: PeliculaMasVista[]): number {
    if (!lista.length) {
      return 0;
    }

    const maximo = Math.max(...lista.map((pelicula) => pelicula.cantidadEntradas));

    if (maximo === 0) {
      return 0;
    }

    return (valor / maximo) * 100;
  }

  obtenerPorcentajeCandy(valor: number): number {
    if (!this.candyMasVendido.length) {
      return 0;
    }

    const maximo = Math.max(...this.candyMasVendido.map((producto) => producto.cantidadVendida));

    if (maximo === 0) {
      return 0;
    }

    return (valor / maximo) * 100;
  }
  exportarPdf(): void {
    this.exportacionService.exportarPdf(
      this.resumen,
      this.peliculasSemanales,
      this.peliculasMensuales,
      this.candyMasVendido,
      this.reporteDiario,
      this.fechaSeleccionada,
      this.logActividad,
    );
  }

  exportarExcel(): void {
    this.exportacionService.exportarExcel(
      this.resumen,
      this.peliculasSemanales,
      this.peliculasMensuales,
      this.candyMasVendido,
      this.reporteDiario,
      this.fechaSeleccionada,
      this.logActividad,
    );
  }
}
