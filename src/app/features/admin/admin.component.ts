import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PeliculasService } from '../../core/services/peliculas.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { SalasService } from '../../core/services/salas.service';

import { Pelicula } from '../../core/models/pelicula.model';
import { Funcion } from '../../core/models/funcion.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private peliculasService = inject(PeliculasService);
  private funcionesService = inject(FuncionesService);
  private salasService = inject(SalasService);

  public peliculas = this.peliculasService.obtenerPeliculas();
  public funciones = this.funcionesService.obtenerFunciones();
  public salas = this.salasService.obtenerSalas();

  public nuevaPelicula: Omit<Pelicula, 'id'> = {
    nombre: '',
    sinopsis: '',
    portadaUrl: '',
    duracionMinutos: 120,
    formato: '2D',
    idioma: 'Subtitulada'
  };

  public nuevaFuncion = {
    peliculaId: '',
    salaId: 'sala-1',
    fechaHoraInicio: '',
    precioEntrada: 4500
  };

  ngOnInit(): void {
    this.peliculasService.cargarPeliculas(false);
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

  async guardarPelicula(): Promise<void> {
    if (!this.nuevaPelicula.nombre.trim() || this.nuevaPelicula.duracionMinutos <= 0) {
      alert('Por favor completá los campos obligatorios de la película.');
      return;
    }

    const idsNumericos = this.peliculas()
      .map(p => parseInt(p.id, 10))
      .filter(id => !isNaN(id));

    const siguienteId = idsNumericos.length > 0 
      ? (Math.max(...idsNumericos) + 1).toString() 
      : '1';

    const peliculaACrear: Pelicula = {
      id: siguienteId,
      ...this.nuevaPelicula
    };

    const OK = await this.peliculasService.agregarPelicula(peliculaACrear);

    if (!OK) {
      alert('Error al guardar la película en la base de datos.');
      return;
    }

    alert('¡Película agregada con éxito!');

    this.nuevaPelicula = {
      nombre: '',
      sinopsis: '',
      portadaUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
      duracionMinutos: 120,
      formato: '2D',
      idioma: 'Subtitulada'
    };

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

    const pelicula = this.peliculas().find(p => p.id === this.nuevaFuncion.peliculaId);
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
      precioEntrada: this.nuevaFuncion.precioEntrada
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
      precioEntrada: 4500
    };
  }

  obtenerPelicula(peliculaId: string): Pelicula | undefined {
    return this.peliculas().find(pelicula => pelicula.id === peliculaId);
  }

  obtenerSala(salaId: string) {
    return this.salas().find(sala => sala.id === salaId);
  }
}