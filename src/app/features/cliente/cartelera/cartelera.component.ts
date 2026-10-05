import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ResenasService } from '../../../core/services/resena.service';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { FuncionesService } from '../../../core/services/funciones.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { AlertasPeliculasService } from '../../../core/services/alerta-peliculas.service';
import { Resena } from '../../../core/models/resena.model';
import { Pelicula } from '../../../core/models/pelicula.model';
import { AlertaPelicula } from '../../../core/models/alerta-pelicula.model';

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
  private funcionesService = inject(FuncionesService);
  private usuariosService = inject(UsuariosService);
  private alertasService = inject(AlertasPeliculasService);
  private router = inject(Router);

  public peliculas = this.peliculasService.obtenerPeliculas();
  public proximamente = signal<Pelicula[]>([]);
  public alertasDisponibles = signal<AlertaPelicula[]>([]);
  public alertasActivadas = signal<Set<string>>(new Set());

  public textoBusqueda = '';
  public generoSeleccionado = '';

  public promedios = signal<Record<string, number>>({});
  public resenas = signal<Record<string, Resena[]>>({});

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
  public mensajesAlerta: Record<string, string> = {};
  public peliculasResenadas = signal<Set<string>>(new Set());

  ngOnInit(): void {
    void this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    await Promise.all([
      this.peliculasService.cargarPeliculas(true),
      this.funcionesService.cargarFunciones(),
    ]);

    this.proximamente.set(
      await this.peliculasService.obtenerPeliculasProximamente()
    );

    await this.cargarTop3();
    await this.cargarResenas();
    await this.cargarAlertas();
  }

  async cargarAlertas(): Promise<void> {
    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuariosService.obtenerUsuarioActual()();

    if (!usuario) {
      return;
    }

    const alertas = await this.alertasService.obtenerMisAlertas(usuario.id);

    this.alertasActivadas.set(
      new Set(alertas.map((alerta) => alerta.peliculaId))
    );

    const peliculaIdsConFunciones = this.funcionesService
      .obtenerFunciones()()
      .map((funcion) => funcion.peliculaId);

    const disponibles = await this.alertasService.obtenerAlertasDisponibles(
      usuario.id,
      [...new Set(peliculaIdsConFunciones)]
    );

    this.alertasDisponibles.set(disponibles);
  }

  async activarAlerta(pelicula: Pelicula): Promise<void> {
    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuariosService.obtenerUsuarioActual()();

    if (!usuario) {
      await this.router.navigate(['/login']);
      return;
    }

    const resultado = await this.alertasService.activarAlerta(
      usuario.id,
      pelicula.id
    );

    this.mensajesAlerta[pelicula.id] = resultado.mensaje;

    if (!resultado.exito) {
      return;
    }

    this.alertasActivadas.update((actuales) => {
      const nuevas = new Set(actuales);
      nuevas.add(pelicula.id);
      return nuevas;
    });
  }

  async desactivarAlerta(pelicula: Pelicula): Promise<void> {
    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuariosService.obtenerUsuarioActual()();

    if (!usuario) {
      return;
    }

    const resultado = await this.alertasService.desactivarAlerta(
      usuario.id,
      pelicula.id
    );

    this.mensajesAlerta[pelicula.id] = resultado.mensaje;

    if (!resultado.exito) {
      return;
    }

    this.alertasActivadas.update((actuales) => {
      const nuevas = new Set(actuales);
      nuevas.delete(pelicula.id);
      return nuevas;
    });
  }

  tieneAlerta(peliculaId: string): boolean {
    return this.alertasActivadas().has(peliculaId);
  }

  obtenerFuncionesPelicula(peliculaId: string) {
    return this.funcionesService
      .obtenerFunciones()()
      .filter((funcion) => funcion.peliculaId === peliculaId);
  }

  estaEnPreventa(pelicula: Pelicula): boolean {
    if (!pelicula.fechaEstreno) {
      return false;
    }

    const inicioPreventa =
      new Date(`${pelicula.fechaEstreno}T00:00:00`).getTime() -
      7 * 24 * 60 * 60 * 1000;

    const estreno = new Date(
      `${pelicula.fechaEstreno}T00:00:00`
    ).getTime();

    const ahora = Date.now();

    return ahora >= inicioPreventa && ahora < estreno;
  }

  puedeComprarEnPreventa(pelicula: Pelicula): boolean {
    return (
      this.estaEnPreventa(pelicula) &&
      this.obtenerFuncionesPelicula(pelicula.id).length > 0
    );
  }

  obtenerFechaPreventa(pelicula: Pelicula): string {
    if (!pelicula.fechaEstreno) {
      return '';
    }

    const fecha = new Date(`${pelicula.fechaEstreno}T00:00:00`);
    fecha.setDate(fecha.getDate() - 7);

    return fecha.toLocaleDateString('es-AR');
  }

  obtenerFechaEstreno(pelicula: Pelicula): string {
    if (!pelicula.fechaEstreno) {
      return 'Fecha no definida';
    }

    return new Date(
      `${pelicula.fechaEstreno}T00:00:00`
    ).toLocaleDateString('es-AR');
  }

  async cargarResenas(): Promise<void> {
    const peliculas = this.peliculas();
    const nuevasResenas: Record<string, Resena[]> = {};
    const nuevosPromedios: Record<string, number> = {};
    const nuevasPeliculasResenadas = new Set<string>();

    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuariosService.obtenerUsuarioActual()();

    for (const pelicula of peliculas) {
      const resenas = await this.resenasService.obtenerResenas(pelicula.id);

      nuevasResenas[pelicula.id] = resenas;

      if (
        usuario &&
        resenas.some((resena) => resena.usuarioId === usuario.id)
      ) {
        nuevasPeliculasResenadas.add(pelicula.id);
      }

      if (resenas.length === 0) {
        nuevosPromedios[pelicula.id] = 0;
      } else {
        const suma = resenas.reduce(
          (total, resena) => total + resena.estrellas,
          0
        );

        nuevosPromedios[pelicula.id] = Number(
          (suma / resenas.length).toFixed(1)
        );
      }
    }

    this.resenas.set(nuevasResenas);
    this.promedios.set(nuevosPromedios);
    this.peliculasResenadas.set(nuevasPeliculasResenadas);
  }

  async cargarTop3(): Promise<void> {
    this.top3 =
      await this.estadisticasService.obtenerTop3PeliculasVendidas();

    this.peliculaTop3Ids = new Set(
      this.top3.map((pelicula) => pelicula.peliculaId)
    );
  }

  get generosDisponibles() {
    const generos = this.peliculas().flatMap(
      (pelicula) => pelicula.generos || []
    );

    const unicos = new Map<string, { id: string; nombre: string }>();

    generos.forEach((genero) => {
      unicos.set(genero.id, genero);
    });

    return Array.from(unicos.values());
  }

  get peliculasFiltradas() {
    const texto = this.textoBusqueda.toLowerCase().trim();

    return this.peliculas().filter((pelicula) => {
      const coincideNombre = pelicula.nombre.toLowerCase().includes(texto);

      const coincideGenero =
        !this.generoSeleccionado ||
        (pelicula.generos || []).some(
          (genero) => genero.id === this.generoSeleccionado
        );

      return coincideNombre && coincideGenero;
    });
  }

  obtenerPelicula(peliculaId: string): Pelicula | undefined {
    return this.peliculas().find((pelicula) => pelicula.id === peliculaId);
  }

  obtenerPromedio(peliculaId: string): number {
    return this.promedios()[peliculaId] || 0;
  }

  obtenerResenas(peliculaId: string): Resena[] {
    return this.resenas()[peliculaId] || [];
  }

  obtenerEstrellas(promedio: number): string {
    if (promedio <= 0) {
      return '☆☆☆☆☆';
    }

    const completas = Math.round(promedio);

    return '★'.repeat(completas) + '☆'.repeat(5 - completas);
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

  mostrarEstrellasHover(peliculaId: string, estrellas: number): void {
    this.estrellasHover[peliculaId] = estrellas;
  }

  quitarEstrellasHover(peliculaId: string): void {
    delete this.estrellasHover[peliculaId];
  }

  seleccionarEstrellas(peliculaId: string, estrellas: number): void {
    this.estrellasNuevaResena[peliculaId] = estrellas;
  }

  async publicarResena(peliculaId: string): Promise<void> {
    if (this.peliculasResenadas().has(peliculaId)) {
      this.mensajeResena[peliculaId] = 'Ya calificaste esta película.';
      return;
    }

    const estrellas = this.estrellasNuevaResena[peliculaId] || 0;
    const comentario = this.comentarioNuevaResena[peliculaId] || '';

    if (estrellas === 0) {
      this.mensajeResena[peliculaId] = 'Seleccioná una puntuación.';
      return;
    }

    if (!comentario.trim()) {
      this.mensajeResena[peliculaId] = 'Escribí un comentario.';
      return;
    }

    const resultado = await this.resenasService.agregarResena(
      peliculaId,
      estrellas,
      comentario
    );

    this.mensajeResena[peliculaId] = resultado.mensaje;

    if (!resultado.exito) {
      return;
    }

    this.peliculasResenadas.update((actuales) => {
      const nuevas = new Set(actuales);
      nuevas.add(peliculaId);
      return nuevas;
    });

    this.estrellasNuevaResena[peliculaId] = 0;
    this.estrellasHover[peliculaId] = 0;
    this.comentarioNuevaResena[peliculaId] = '';

    const nuevasResenas =
      await this.resenasService.obtenerResenas(peliculaId);

    this.resenas.update((actuales) => ({
      ...actuales,
      [peliculaId]: nuevasResenas,
    }));

    if (nuevasResenas.length === 0) {
      this.promedios.update((actuales) => ({
        ...actuales,
        [peliculaId]: 0,
      }));
    } else {
      const suma = nuevasResenas.reduce(
        (total, resena) => total + resena.estrellas,
        0
      );

      const promedio = Number(
        (suma / nuevasResenas.length).toFixed(1)
      );

      this.promedios.update((actuales) => ({
        ...actuales,
        [peliculaId]: promedio,
      }));
    }
  }
}
