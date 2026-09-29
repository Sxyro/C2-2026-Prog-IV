import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ResenasService } from '../../../core/services/resena.service';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { Resena } from '../../../core/models/resena.model';
import { Pelicula } from '../../../core/models/pelicula.model';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cartelera.component.html',
  styleUrl: './cartelera.component.css',
})
export class CarteleraComponent implements OnInit {
  private peliculasService = inject(PeliculasService);
  private resenasService = inject(ResenasService);
  private estadisticasService = inject(EstadisticasService);

  public peliculas = this.peliculasService.obtenerPeliculas();
  public textoBusqueda = '';
  public generoSeleccionado = '';

  public promedios: Record<string, number> = {};
  public resenas: Record<string, Resena[]> = {};

  public top3: {
    peliculaId: string;
    cantidadEntradas: number;
  }[] = [];

  public peliculaTop3Ids = new Set<string>();

  public resenaAbierta: string | null = null;

  public estrellasNuevaResena: Record<string, number> = {};
  public estrellasHover: Record<string, number> = {};
  public comentarioNuevaResena: Record<string, string> = {};
  public mensajeResena: Record<string, string> = {};

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    await this.peliculasService.cargarPeliculas(true);
    await this.cargarResenas();
    await this.cargarTop3();
  }

  async cargarResenas(): Promise<void> {
    const peliculas = this.peliculas();

    for (const pelicula of peliculas) {
      const resenas =
        await this.resenasService.obtenerResenas(pelicula.id);

      this.resenas[pelicula.id] = resenas;

      if (resenas.length === 0) {
        this.promedios[pelicula.id] = 0;
      } else {
        const suma = resenas.reduce(
          (total, resena) => total + resena.estrellas,
          0
        );

        this.promedios[pelicula.id] = Number(
          (suma / resenas.length).toFixed(1)
        );
      }
    }
  }

  async cargarTop3(): Promise<void> {
    this.top3 =
      await this.estadisticasService.obtenerTop3PeliculasVendidas();

    this.peliculaTop3Ids = new Set(
      this.top3.map((pelicula) => pelicula.peliculaId)
    );
  }

  get generosDisponibles() {
    const generos = this.peliculas()
      .flatMap((pelicula) => pelicula.generos || []);

    const unicos = new Map<string, { id: string; nombre: string }>();

    generos.forEach((genero) => {
      unicos.set(genero.id, genero);
    });

    return Array.from(unicos.values());
  }

  get peliculasFiltradas() {
    const texto = this.textoBusqueda.toLowerCase().trim();

    return this.peliculas().filter((pelicula) => {
      const coincideNombre =
        pelicula.nombre.toLowerCase().includes(texto);

      const coincideGenero =
        !this.generoSeleccionado ||
        (pelicula.generos || []).some(
          (genero) => genero.id === this.generoSeleccionado
        );

      return coincideNombre && coincideGenero;
    });
  }

  obtenerPelicula(peliculaId: string): Pelicula | undefined {
    return this.peliculas().find(
      (pelicula) => pelicula.id === peliculaId
    );
  }

  obtenerPromedio(peliculaId: string): number {
    return this.promedios[peliculaId] || 0;
  }

  obtenerResenas(peliculaId: string): Resena[] {
    return this.resenas[peliculaId] || [];
  }

  obtenerEstrellas(promedio: number): string {
    if (promedio <= 0) {
      return '☆☆☆☆☆';
    }

    const completas = Math.round(promedio);

    return (
      '★'.repeat(completas) +
      '☆'.repeat(5 - completas)
    );
  }

  esTop3(peliculaId: string): boolean {
    return this.peliculaTop3Ids.has(peliculaId);
  }

  obtenerPosicionTop3(peliculaId: string): number {
    const posicion = this.top3.findIndex(
      (pelicula) => pelicula.peliculaId === peliculaId
    );

    return posicion >= 0 ? posicion + 1 : 0;
  }

  obtenerVentas(peliculaId: string): number {
    const pelicula = this.top3.find(
      (item) => item.peliculaId === peliculaId
    );

    return pelicula?.cantidadEntradas || 0;
  }

  toggleResenas(peliculaId: string): void {
    if (this.resenaAbierta === peliculaId) {
      this.resenaAbierta = null;
    } else {
      this.resenaAbierta = peliculaId;
    }
  }

  mostrarEstrellasHover(
    peliculaId: string,
    estrellas: number
  ): void {
    this.estrellasHover[peliculaId] = estrellas;
  }

  quitarEstrellasHover(peliculaId: string): void {
    delete this.estrellasHover[peliculaId];
  }

  seleccionarEstrellas(
    peliculaId: string,
    estrellas: number
  ): void {
    this.estrellasNuevaResena[peliculaId] = estrellas;
  }

  async publicarResena(peliculaId: string): Promise<void> {
    const estrellas =
      this.estrellasNuevaResena[peliculaId] || 0;

    const comentario =
      this.comentarioNuevaResena[peliculaId] || '';

    if (estrellas === 0) {
      this.mensajeResena[peliculaId] =
        'Seleccioná una puntuación.';
      return;
    }

    if (!comentario.trim()) {
      this.mensajeResena[peliculaId] =
        'Escribí un comentario.';
      return;
    }

    const resultado =
      await this.resenasService.agregarResena(
        peliculaId,
        estrellas,
        comentario
      );

    this.mensajeResena[peliculaId] =
      resultado.mensaje;

    if (!resultado.exito) {
      return;
    }

    this.estrellasNuevaResena[peliculaId] = 0;
    this.estrellasHover[peliculaId] = 0;
    this.comentarioNuevaResena[peliculaId] = '';

    const nuevasResenas =
      await this.resenasService.obtenerResenas(peliculaId);

    this.resenas[peliculaId] = nuevasResenas;

    if (nuevasResenas.length === 0) {
      this.promedios[peliculaId] = 0;
    } else {
      const suma = nuevasResenas.reduce(
        (total, resena) => total + resena.estrellas,
        0
      );

      this.promedios[peliculaId] = Number(
        (suma / nuevasResenas.length).toFixed(1)
      );
    }
  }
}