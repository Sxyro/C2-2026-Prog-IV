import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { GenerosService } from '../../../core/services/generos.service';
import { Pelicula, ClasificacionEdad } from '../../../core/models/pelicula.model';
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

  public peliculas = this.peliculasService.obtenerPeliculas();
  public generos: Genero[] = [];
  public generosSeleccionados: string[] = [];

  public clasificacionesEdad: ClasificacionEdad[] = ['ATP', '+13', '+18'];

  public nuevaPelicula: Omit<Pelicula, 'id'> = {
    nombre: '',
    sinopsis: '',
    portadaUrl: '',
    duracionMinutos: 120,
    formato: '2D',
    idioma: 'Subtitulada',
    clasificacionEdad: 'ATP',
    publicada: true,
    fechaEstreno: '',
    precioPreventa: null,
  };

  public archivoPortada: File | null = null;
  public vistaPreviaPortada: string | null = null;
  public subiendoPortada = false;

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  async ngOnInit(): Promise<void> {
    await this.peliculasService.cargarPeliculas(false);
    this.generos = await this.generosService.obtenerGeneros();
  }

  toggleGenero(generoId: string): void {
    if (this.generosSeleccionados.includes(generoId)) {
      this.generosSeleccionados = this.generosSeleccionados.filter((id) => id !== generoId);
    } else {
      this.generosSeleccionados = [...this.generosSeleccionados, generoId];
    }
  }

  seleccionarPortada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      this.abrirModal(
        'Archivo no válido',
        'Seleccioná un archivo de imagen válido para la portada.',
        'error',
      );

      input.value = '';
      return;
    }

    this.archivoPortada = archivo;

    if (this.vistaPreviaPortada) {
      URL.revokeObjectURL(this.vistaPreviaPortada);
    }

    this.vistaPreviaPortada = URL.createObjectURL(archivo);
  }

  async guardarPelicula(): Promise<void> {
    if (!this.nuevaPelicula.nombre.trim() || this.nuevaPelicula.duracionMinutos <= 0) {
      this.abrirModal(
        'Datos incompletos',
        'Por favor completá los campos obligatorios de la película.',
        'error',
      );
      return;
    }

    if (!this.nuevaPelicula.fechaEstreno) {
      this.abrirModal(
        'Falta la fecha de estreno',
        'Ingresá la fecha en la que se estrenará la película.',
        'error',
      );
      return;
    }

    if (this.generosSeleccionados.length === 0) {
      this.abrirModal(
        'Falta seleccionar género',
        'Seleccioná al menos un género para la película.',
        'error',
      );
      return;
    }

    if (!this.archivoPortada) {
      this.abrirModal('Falta la portada', 'Seleccioná una imagen para la portada.', 'error');
      return;
    }

    const fechaEstreno = new Date(`${this.nuevaPelicula.fechaEstreno}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const esFutura = fechaEstreno.getTime() > hoy.getTime();

    if (
      esFutura &&
      (!this.nuevaPelicula.precioPreventa || this.nuevaPelicula.precioPreventa <= 0)
    ) {
      this.abrirModal(
        'Falta el precio de preventa',
        'Para una película próxima ingresá el precio especial de preventa.',
        'error',
      );
      return;
    }

    const idsNumericos = this.peliculas()
      .map((p) => parseInt(p.id, 10))
      .filter((id) => !isNaN(id));

    const siguienteId = idsNumericos.length > 0 ? (Math.max(...idsNumericos) + 1).toString() : '1';

    const peliculaACrear: Pelicula = {
      id: siguienteId,
      ...this.nuevaPelicula,
      publicada: esFutura ? false : true,
    };

    this.subiendoPortada = true;

    const portadaUrl = await this.peliculasService.subirPortada(this.archivoPortada, siguienteId);

    if (!portadaUrl) {
      this.subiendoPortada = false;

      this.abrirModal(
        'Error al subir la portada',
        'No se pudo subir la imagen de la película.',
        'error',
      );

      return;
    }

    peliculaACrear.portadaUrl = portadaUrl;

    const ok = await this.peliculasService.agregarPelicula(
      peliculaACrear,
      this.generosSeleccionados,
    );

    this.subiendoPortada = false;

    if (!ok) {
      this.abrirModal(
        'Error al guardar',
        'Ocurrió un error al guardar la película en la base de datos.',
        'error',
      );

      return;
    }

    this.abrirModal(
      '¡Película agregada!',
      esFutura
        ? 'La película fue agregada a Próximamente y tendrá preventa desde 7 días antes del estreno.'
        : 'La película fue agregada correctamente al catálogo.',
      'exito',
    );

    this.nuevaPelicula = {
      nombre: '',
      sinopsis: '',
      portadaUrl: '',
      duracionMinutos: 120,
      formato: '2D',
      idioma: 'Subtitulada',
      clasificacionEdad: 'ATP',
      publicada: true,
      fechaEstreno: '',
      precioPreventa: null,
    };

    this.generosSeleccionados = [];
    this.archivoPortada = null;

    if (this.vistaPreviaPortada) {
      URL.revokeObjectURL(this.vistaPreviaPortada);
    }

    this.vistaPreviaPortada = null;

    await this.peliculasService.cargarPeliculas(false);
  }

  async toggleVisibilidad(pelicula: Pelicula): Promise<void> {
    const nuevoEstado = !(pelicula.publicada ?? true);

    const ok = await this.peliculasService.cambiarEstadoPublicacion(pelicula.id, nuevoEstado);

    if (!ok) {
      this.abrirModal(
        'Error al actualizar',
        'No se pudo actualizar la visibilidad de la película.',
        'error',
      );

      return;
    }

    await this.peliculasService.cargarPeliculas(false);

    this.abrirModal(
      nuevoEstado ? 'Película publicada' : 'Película ocultada',
      nuevoEstado
        ? 'La película ahora aparece en la cartelera.'
        : 'La película fue ocultada de la cartelera.',
      'exito',
    );
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR');
  }

  abrirModal(titulo: string, mensaje: string, tipo: 'error' | 'exito' = 'error'): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }
}
