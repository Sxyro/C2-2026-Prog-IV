import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';
import { Pelicula } from '../models/pelicula.model';
import { Funcion } from '../models/funcion.model';
import { Butaca } from '../models/butaca.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  async generarEntradaPdf(datos: {
    pelicula: Pelicula;
    funcion: Funcion;
    butacas: Butaca[];
    total: number;
    emailComprador: string;
  }): Promise<void> {
    const doc = new jsPDF();
    const { pelicula, funcion, butacas, total, emailComprador } = datos;

    // Encabezado
    doc.setFillColor(230, 57, 70);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET DE ENTRADA - CINE', 105, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(pelicula.nombre, 20, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Formato: ${pelicula.formato} | Idioma: ${pelicula.idioma}`, 20, 53);
    doc.text(`Duración: ${pelicula.duracionMinutos} min`, 20, 60);
    
    const fechaHora = new Date(funcion.fechaHoraInicio).toLocaleString();
    doc.text(`Función: ${fechaHora}hs - Sala ${funcion.salaId}`, 20, 70);
    
    const listaButacas = butacas.map(b => `${b.fila}-${b.columna}`).join(', ');
    doc.setFont('helvetica', 'bold');
    doc.text(`Butacas (${butacas.length}): ${listaButacas}`, 20, 80);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Comprador: ${emailComprador}`, 20, 90);
    doc.text(`Monto Total: $${total}`, 20, 98);

    const payloadQR = JSON.stringify({
      pelicula: pelicula.nombre,
      sala: funcion.salaId,
      fecha: funcion.fechaHoraInicio,
      butacas: listaButacas,
      comprador: emailComprador
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(payloadQR, { width: 150, margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 25, 110, 60, 60);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Escaneá este código en el ingreso a la sala', 25, 175);
    } catch (err) {
      console.error('Error al generar el QR:', err);
    }

    doc.save(`Entrada_${pelicula.nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  }
}