import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';
import { Pelicula } from '../models/pelicula.model';
import { Funcion } from '../models/funcion.model';
import { Butaca } from '../models/butaca.model';
import { ProductoCandySeleccionado } from '../models/producto-candy.model';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  async generarEntradaPdf(datos: {
    reservaId: string;
    pelicula: Pelicula;
    funcion: Funcion;
    butacas: Butaca[];
    total: number;
    emailComprador: string;
    productosCandy: ProductoCandySeleccionado[];
  }): Promise<void> {
    const doc = new jsPDF();

    const { reservaId, pelicula, funcion, butacas, total, emailComprador, productosCandy } = datos;

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

    const listaButacas = butacas.map((b) => `${b.fila}-${b.columna}`).join(', ');

    doc.setFont('helvetica', 'bold');

    doc.text(`Butacas (${butacas.length}): ${listaButacas}`, 20, 80);

    doc.setFont('helvetica', 'normal');

    doc.text(`Comprador: ${emailComprador}`, 20, 90);

    let posicionY = 98;

    if (productosCandy.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);

      doc.text('CANDY', 20, posicionY);

      posicionY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      for (const item of productosCandy) {
        const linea = `${item.cantidad} x ${item.producto.nombre}`;

        const precio = `$${item.subtotal.toLocaleString('es-AR')}`;

        doc.text(linea, 20, posicionY);
        doc.text(precio, 175, posicionY);

        posicionY += 6;
      }

      posicionY += 2;

      doc.setFont('helvetica', 'bold');

      doc.text(
        `Subtotal Candy: $${productosCandy
          .reduce((suma, item) => suma + item.subtotal, 0)
          .toLocaleString('es-AR')}`,
        20,
        posicionY,
      );

      posicionY += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);

    doc.text(`Monto Total: $${total.toLocaleString('es-AR')}`, 20, posicionY);

    posicionY += 8;

    const codigoCorto = reservaId.slice(0, 8).toUpperCase();

    doc.text(`Código de entrada: ${codigoCorto}`, 20, posicionY);

    posicionY += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const payloadQR = JSON.stringify({
      reservaId,
      pelicula: pelicula.nombre,
      sala: funcion.salaId,
      fecha: funcion.fechaHoraInicio,
      butacas: listaButacas,
      comprador: emailComprador,
      candy: productosCandy.map((item) => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
      })),
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(payloadQR, {
        width: 150,
        margin: 1,
      });

      doc.addImage(qrDataUrl, 'PNG', 25, posicionY, 60, 60);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      doc.text(
        'Escaneá este código para validar la entrada y retirar el Candy',
        20,
        posicionY + 66,
      );
    } catch (err) {
      console.error('Error al generar el QR:', err);
    }

    doc.save(`Entrada_${pelicula.nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  }
}
