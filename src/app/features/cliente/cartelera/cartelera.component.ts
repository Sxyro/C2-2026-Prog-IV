import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas.service';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cartelera.component.html',
  styleUrl: './cartelera.component.css'
})
export class CarteleraComponent implements OnInit {
  private peliculasService = inject(PeliculasService);

  public peliculas = this.peliculasService.obtenerPeliculas();

  ngOnInit(): void {
    this.peliculasService.cargarPeliculas(true);
  }
}