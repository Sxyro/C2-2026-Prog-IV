import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { GenerosService } from '../../../core/services/generos.service';
import {
  Pelicula,
  ClasificacionEdad
} from '../../../core/models/pelicula.model';
import { Genero } from '../../../core/models/genero.model';

@Component({
  selector: 'app-peliculas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './peliculas-admin.component.html',
  styleUrl: './peliculas-admin.component.css',
})
export class PeliculasAdminComponent implements OnInit {
  private peliculasService = inject(PeliculasService);
  private generosService = inject(GenerosService);

  public peliculas =
    this.peliculasService.obtenerPeliculas();

  public generos: Genero[] = [];

  public generosSeleccionados: string[] = [];

  public clasificacionesEdad: ClasificacionEdad[] = [
    'ATP',
    '+13',
    '+18'
  ];

  public nuevaPelicula: Omit<Pelicula, 'id'> = {
    nombre: '',
    sinopsis: '',
    portadaUrl: '',
    duracionMinutos: 120,
    formato: '2D',
    idioma: 'Subtitulada',
    clasificacionEdad: 'ATP',
  };

  async ngOnInit(): Promise<void> {
    await this.peliculasService.cargarPeliculas(false);
    this.generos =
      await this.generosService.obtenerGeneros();
  }

  toggleGenero(generoId: string): void {
    if (
      this.generosSeleccionados.includes(generoId)
    ) {
      this.generosSeleccionados =
        this.generosSeleccionados.filter(
          id => id !== generoId
        );
    } else {
      this.generosSeleccionados = [
        ...this.generosSeleccionados,
        generoId
      ];
    }
  }

  async guardarPelicula(): Promise<void> {
    if (
      !this.nuevaPelicula.nombre.trim() ||
      this.nuevaPelicula.duracionMinutos <= 0
    ) {
      alert(
        'Por favor completá los campos obligatorios de la película.'
      );
      return;
    }

    if (
      this.generosSeleccionados.length === 0
    ) {
      alert(
        'Seleccioná al menos un género para la película.'
      );
      return;
    }

    const idsNumericos =
      this.peliculas()
        .map(p => parseInt(p.id, 10))
        .filter(id => !isNaN(id));

    const siguienteId =
      idsNumericos.length > 0
        ? (
            Math.max(...idsNumericos) + 1
          ).toString()
        : '1';

    const peliculaACrear: Pelicula = {
      id: siguienteId,
      ...this.nuevaPelicula,
    };

    const OK =
      await this.peliculasService.agregarPelicula(
        peliculaACrear,
        this.generosSeleccionados
      );

    if (!OK) {
      alert(
        'Error al guardar la película en la base de datos.'
      );
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
      clasificacionEdad: 'ATP',
    };

    this.generosSeleccionados = [];

    await this.peliculasService.cargarPeliculas(false);
  }

  async toggleVisibilidad(
    pelicula: Pelicula
  ): Promise<void> {
    const nuevoEstado =
      !(pelicula.publicada ?? true);

    const ok =
      await this.peliculasService
        .cambiarEstadoPublicacion(
          pelicula.id,
          nuevoEstado
        );

    if (!ok) {
      alert(
        'Error al actualizar la visibilidad de la película.'
      );
      return;
    }

    await this.peliculasService.cargarPeliculas(false);
  }
}