import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cartelera.component.html',
  styleUrl: './cartelera.component.css'
})
export class CarteleraComponent implements OnInit {

  private peliculasService = inject(PeliculasService);

  public peliculas = this.peliculasService.obtenerPeliculas();

  public textoBusqueda = '';
  public generoSeleccionado = '';

  ngOnInit(): void {
    this.peliculasService.cargarPeliculas(true);
  }

  get generosDisponibles() {

    const generos = this.peliculas()
      .flatMap(pelicula => pelicula.generos || []);

    const unicos = new Map<string, { id: string; nombre: string }>();

    generos.forEach(genero => {
      unicos.set(genero.id, genero);
    });

    return Array.from(unicos.values());
  }

  get peliculasFiltradas() {

    const texto = this.textoBusqueda.toLowerCase().trim();

    return this.peliculas().filter(pelicula => {

      const coincideNombre =
        pelicula.nombre.toLowerCase().includes(texto);

      const coincideGenero =
        !this.generoSeleccionado ||
        (pelicula.generos || []).some(
          genero => genero.id === this.generoSeleccionado
        );

      return coincideNombre && coincideGenero;
    });
  }
}