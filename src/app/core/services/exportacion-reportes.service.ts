import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  CandyMasVendido,
  LogActividad,
  PeliculaMasVista,
  ReporteDiario,
  ResumenFinanciero,
} from '../models/reportes.model';

@Injectable({
  providedIn: 'root',
})
export class ExportacionReportesService {
  exportarPdf(
    resumen: ResumenFinanciero | null,
    peliculasSemanales: PeliculaMasVista[],
    peliculasMensuales: PeliculaMasVista[],
    candyMasVendido: CandyMasVendido[],
    reporteDiario: ReporteDiario | null,
    fechaSeleccionada: string,
    logActividad: LogActividad[],
  ): void {
    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cine Imperial', 20, y);

    y += 9;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Reporte de administración', 20, y);

    y += 12;

    pdf.setDrawColor(193, 18, 31);
    pdf.line(20, y, 190, y);

    y += 12;

    y = this.agregarTitulo(pdf, 'Resumen financiero', y);

    if (resumen) {
      y = this.agregarLinea(pdf, 'Facturación', this.formatearDinero(resumen.facturacion), y);
      y = this.agregarLinea(pdf, 'Entradas vendidas', String(resumen.entradasVendidas), y);
      y = this.agregarLinea(pdf, 'Reservas totales', String(resumen.reservasTotales), y);
      y = this.agregarLinea(pdf, 'Reservas canceladas', String(resumen.reservasCanceladas), y);
      y = this.agregarLinea(
        pdf,
        'Crédito generado',
        this.formatearDinero(resumen.creditoGenerado),
        y,
      );
      y = this.agregarLinea(pdf, 'Ventas Candy', this.formatearDinero(resumen.ventasCandy), y);
    } else {
      y = this.agregarTexto(pdf, 'No hay datos financieros disponibles.', y);
    }

    y += 8;
    y = this.agregarTitulo(pdf, 'Películas más vistas - últimos 7 días', y);

    if (peliculasSemanales.length) {
      peliculasSemanales.forEach((pelicula, index) => {
        y = this.agregarLinea(
          pdf,
          `${index + 1}. ${pelicula.peliculaNombre}`,
          `${pelicula.cantidadEntradas} entradas`,
          y,
        );
        y = this.verificarSaltoPagina(pdf, y);
      });
    } else {
      y = this.agregarTexto(pdf, 'No hay ventas registradas.', y);
    }

    y += 8;
    y = this.verificarSaltoPagina(pdf, y);
    y = this.agregarTitulo(pdf, 'Películas más vistas - últimos 30 días', y);

    if (peliculasMensuales.length) {
      peliculasMensuales.forEach((pelicula, index) => {
        y = this.agregarLinea(
          pdf,
          `${index + 1}. ${pelicula.peliculaNombre}`,
          `${pelicula.cantidadEntradas} entradas`,
          y,
        );
        y = this.verificarSaltoPagina(pdf, y);
      });
    } else {
      y = this.agregarTexto(pdf, 'No hay ventas registradas.', y);
    }

    y += 8;
    y = this.verificarSaltoPagina(pdf, y);
    y = this.agregarTitulo(pdf, 'Candy Bar - productos más vendidos', y);

    if (candyMasVendido.length) {
      candyMasVendido.forEach((producto, index) => {
        y = this.agregarLinea(
          pdf,
          `${index + 1}. ${producto.productoNombre}`,
          `${producto.cantidadVendida} unidades · ${this.formatearDinero(producto.facturacion)}`,
          y,
        );
        y = this.verificarSaltoPagina(pdf, y);
      });
    } else {
      y = this.agregarTexto(pdf, 'No hay ventas de Candy registradas.', y);
    }

    y += 8;
    y = this.verificarSaltoPagina(pdf, y);
    y = this.agregarTitulo(
      pdf,
      `Reporte diario - ${this.formatearFechaCorta(fechaSeleccionada)}`,
      y,
    );

    if (reporteDiario) {
      y = this.agregarLinea(pdf, 'Facturación', this.formatearDinero(reporteDiario.facturacion), y);
      y = this.agregarLinea(pdf, 'Entradas vendidas', String(reporteDiario.entradasVendidas), y);
      y = this.agregarLinea(pdf, 'Reservas', String(reporteDiario.reservas), y);
      y = this.agregarLinea(pdf, 'Cancelaciones', String(reporteDiario.cancelaciones), y);
      y = this.agregarLinea(
        pdf,
        'Crédito generado',
        this.formatearDinero(reporteDiario.creditoGenerado),
        y,
      );
      y = this.agregarLinea(
        pdf,
        'Ventas Candy',
        this.formatearDinero(reporteDiario.ventasCandy),
        y,
      );
    } else {
      y = this.agregarTexto(pdf, 'No hay datos para la fecha seleccionada.', y);
    }

    y += 8;
    y = this.verificarSaltoPagina(pdf, y);
    y = this.agregarTitulo(pdf, 'Actividad del sistema', y);

    if (logActividad.length) {
      logActividad.forEach((log) => {
        const texto = `${log.accion} - ${log.descripcion}`;
        const usuario = `${log.usuarioNombre} · ${log.usuarioEmail}`;
        const fecha = this.formatearFechaCompleta(log.fechaHora);

        y = this.verificarSaltoPagina(pdf, y);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(texto.substring(0, 100), 20, y);

        y += 5;

        pdf.setFont('helvetica', 'normal');
        pdf.text(usuario.substring(0, 100), 20, y);

        y += 5;

        pdf.setTextColor(100, 100, 100);
        pdf.text(fecha, 20, y);
        pdf.setTextColor(0, 0, 0);

        y += 8;
      });
    } else {
      y = this.agregarTexto(pdf, 'No hay actividad registrada.', y);
    }

    pdf.save(`reporte-cine-imperial-${fechaSeleccionada}.pdf`);
  }

  exportarExcel(
    resumen: ResumenFinanciero | null,
    peliculasSemanales: PeliculaMasVista[],
    peliculasMensuales: PeliculaMasVista[],
    candyMasVendido: CandyMasVendido[],
    reporteDiario: ReporteDiario | null,
    fechaSeleccionada: string,
    logActividad: LogActividad[],
  ): void {
    const libro = XLSX.utils.book_new();

    const resumenData = [
      ['CINE IMPERIAL - RESUMEN FINANCIERO'],
      [],
      ['Concepto', 'Valor'],
      ['Facturación', resumen?.facturacion ?? 0],
      ['Entradas vendidas', resumen?.entradasVendidas ?? 0],
      ['Reservas totales', resumen?.reservasTotales ?? 0],
      ['Reservas canceladas', resumen?.reservasCanceladas ?? 0],
      ['Crédito generado', resumen?.creditoGenerado ?? 0],
      ['Ventas Candy', resumen?.ventasCandy ?? 0],
    ];

    this.agregarHoja(libro, resumenData, 'Resumen');

    const semanalData = [
      ['PELÍCULAS MÁS VISTAS - ÚLTIMOS 7 DÍAS'],
      [],
      ['Posición', 'Película', 'Entradas'],
      ...peliculasSemanales.map((pelicula, index) => [
        index + 1,
        pelicula.peliculaNombre,
        pelicula.cantidadEntradas,
      ]),
    ];

    this.agregarHoja(libro, semanalData, 'Películas 7 días');

    const mensualData = [
      ['PELÍCULAS MÁS VISTAS - ÚLTIMOS 30 DÍAS'],
      [],
      ['Posición', 'Película', 'Entradas'],
      ...peliculasMensuales.map((pelicula, index) => [
        index + 1,
        pelicula.peliculaNombre,
        pelicula.cantidadEntradas,
      ]),
    ];

    this.agregarHoja(libro, mensualData, 'Películas 30 días');

    const candyData = [
      ['CANDY BAR - PRODUCTOS MÁS VENDIDOS'],
      [],
      ['Posición', 'Producto', 'Unidades vendidas', 'Facturación'],
      ...candyMasVendido.map((producto, index) => [
        index + 1,
        producto.productoNombre,
        producto.cantidadVendida,
        producto.facturacion,
      ]),
    ];

    this.agregarHoja(libro, candyData, 'Candy Bar');

    const diarioData = [
      [`REPORTE DIARIO - ${this.formatearFechaCorta(fechaSeleccionada)}`],
      [],
      ['Concepto', 'Valor'],
      ['Facturación', reporteDiario?.facturacion ?? 0],
      ['Entradas vendidas', reporteDiario?.entradasVendidas ?? 0],
      ['Reservas', reporteDiario?.reservas ?? 0],
      ['Cancelaciones', reporteDiario?.cancelaciones ?? 0],
      ['Crédito generado', reporteDiario?.creditoGenerado ?? 0],
      ['Ventas Candy', reporteDiario?.ventasCandy ?? 0],
    ];

    this.agregarHoja(libro, diarioData, 'Reporte diario');

    const logData = [
      ['ACTIVIDAD DEL SISTEMA'],
      [],
      ['Acción', 'Descripción', 'Usuario', 'Email', 'Fecha y hora'],
      ...logActividad.map((log) => [
        log.accion,
        log.descripcion,
        log.usuarioNombre,
        log.usuarioEmail,
        this.formatearFechaCompleta(log.fechaHora),
      ]),
    ];

    this.agregarHoja(libro, logData, 'Actividad');

    XLSX.writeFile(libro, `reporte-cine-imperial-${fechaSeleccionada}.xlsx`);
  }

  private agregarHoja(libro: XLSX.WorkBook, datos: unknown[][], nombre: string): void {
    const hoja = XLSX.utils.aoa_to_sheet(datos);

    hoja['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 22 }, { wch: 32 }, { wch: 24 }];

    XLSX.utils.book_append_sheet(libro, hoja, nombre);
  }

  private agregarTitulo(pdf: jsPDF, texto: string, y: number): number {
    y = this.verificarSaltoPagina(pdf, y);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(193, 18, 31);
    pdf.text(texto, 20, y);
    pdf.setTextColor(0, 0, 0);

    return y + 8;
  }

  private agregarLinea(pdf: jsPDF, etiqueta: string, valor: string, y: number): number {
    y = this.verificarSaltoPagina(pdf, y);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(etiqueta, 20, y);

    pdf.setFont('helvetica', 'bold');
    pdf.text(valor, 190, y, { align: 'right' });

    return y + 6;
  }

  private agregarTexto(pdf: jsPDF, texto: string, y: number): number {
    y = this.verificarSaltoPagina(pdf, y);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(texto, 20, y);

    return y + 6;
  }

  private verificarSaltoPagina(pdf: jsPDF, y: number): number {
    if (y > 275) {
      pdf.addPage();
      return 20;
    }

    return y;
  }

  private formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  private formatearFechaCorta(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private formatearFechaCompleta(fecha: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fecha));
  }
}
