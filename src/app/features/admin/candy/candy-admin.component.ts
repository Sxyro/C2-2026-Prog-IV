import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CandyService } from '../../../core/services/candy.service';
import { ComboService } from '../../../core/services/combo.service';
import { PeliculasService } from '../../../core/services/peliculas.service';
import { CategoriaCandy, ProductoCandy } from '../../../core/models/producto-candy.model';
import { Combo } from '../../../core/models/combo.model';

@Component({
  selector: 'app-candy-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candy-admin.component.html',
  styleUrl: './candy-admin.component.css',
})
export class CandyAdminComponent implements OnInit {
  private candyService = inject(CandyService);
  private comboService = inject(ComboService);
  private peliculasService = inject(PeliculasService);

  public categorias = signal<CategoriaCandy[]>([]);
  public productos = signal<ProductoCandy[]>([]);
  public combos = signal<Combo[]>([]);

  public nombreNuevaCategoria = '';
  public categoriaEditandoId: string | null = null;
  public nombreCategoriaEditando = '';

  public productoEditandoId: string | null = null;

  public comboEditandoId: string | null = null;
  public cantidadesCombo = signal<Record<string, number>>({});

  public nuevoProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoriaId: '',
    imagenUrl: '',
    activo: true,
    cantidadEntradas: 0,
  };

  public nuevoCombo = {
    nombre: '',
    descripcion: '',
    precio: 0,
    cantidadEntradas: 1,
    imagenUrl: '',
    activo: true,
  };

  public archivoCombo: File | null = null;
  public vistaPreviaCombo: string | null = null;
  public subiendoCombo = false;

  public archivoProducto: File | null = null;
  public vistaPreviaProducto: string | null = null;
  public subiendoProducto = false;

  public mensaje = signal<string | null>(null);
  public tipoMensaje = signal<'ok' | 'error'>('ok');

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    const [categorias, productos, combos] = await Promise.all([
      this.candyService.obtenerCategorias(),
      this.candyService.obtenerTodosLosProductos(),
      this.comboService.obtenerTodosLosCombos(),
    ]);

    this.categorias.set(categorias);
    this.productos.set(productos);
    this.combos.set(combos);

    if (!this.nuevoProducto.categoriaId && categorias.length > 0) {
      this.nuevoProducto.categoriaId = categorias[0].id;
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'ok' | 'error'): void {
    this.mensaje.set(mensaje);
    this.tipoMensaje.set(tipo);

    setTimeout(() => {
      this.mensaje.set(null);
    }, 3500);
  }

  async crearCategoria(): Promise<void> {
    const resultado = await this.candyService.crearCategoria(this.nombreNuevaCategoria);

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    this.nombreNuevaCategoria = '';
    await this.cargarDatos();
  }

  comenzarEditarCategoria(categoria: CategoriaCandy): void {
    this.categoriaEditandoId = categoria.id;
    this.nombreCategoriaEditando = categoria.nombre;
  }

  cancelarEditarCategoria(): void {
    this.categoriaEditandoId = null;
    this.nombreCategoriaEditando = '';
  }

  async guardarCategoria(): Promise<void> {
    if (!this.categoriaEditandoId) {
      return;
    }

    const resultado = await this.candyService.actualizarCategoria(
      this.categoriaEditandoId,
      this.nombreCategoriaEditando,
    );

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    this.cancelarEditarCategoria();
    await this.cargarDatos();
  }

  async crearProducto(): Promise<void> {
    if (!this.nuevoProducto.nombre.trim()) {
      this.mostrarMensaje('Ingresá el nombre del producto.', 'error');
      return;
    }

    if (this.nuevoProducto.precio <= 0) {
      this.mostrarMensaje('El precio debe ser mayor a cero.', 'error');
      return;
    }

    if (!this.nuevoProducto.categoriaId) {
      this.mostrarMensaje('Seleccioná una categoría.', 'error');
      return;
    }

    if (!this.archivoProducto) {
      this.abrirModal('Falta la imagen', 'Seleccioná una imagen para el producto.', 'error');
      return;
    }

    const productoId = crypto.randomUUID();

    this.subiendoProducto = true;

    const imagenUrl = await this.peliculasService.subirPortada(this.archivoProducto, productoId);

    if (!imagenUrl) {
      this.subiendoProducto = false;

      this.abrirModal(
        'Error al subir la imagen',
        'No se pudo subir la imagen del producto.',
        'error',
      );

      return;
    }

    const resultado = await this.candyService.crearProducto({
      ...this.nuevoProducto,
      imagenUrl,
    });

    this.subiendoProducto = false;

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoriaId: this.categorias()[0]?.id || '',
      imagenUrl: '',
      activo: true,
      cantidadEntradas: 0,
    };

    this.archivoProducto = null;

    if (this.vistaPreviaProducto) {
      URL.revokeObjectURL(this.vistaPreviaProducto);
    }

    this.vistaPreviaProducto = null;

    await this.cargarDatos();
  }

  comenzarEditarProducto(producto: ProductoCandy): void {
    this.productoEditandoId = producto.id;
  }

  cancelarEditarProducto(): void {
    this.productoEditandoId = null;
  }

  async guardarProducto(producto: ProductoCandy): Promise<void> {
    const resultado = await this.candyService.actualizarProducto(producto);

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    this.productoEditandoId = null;
    await this.cargarDatos();
  }

  async cambiarEstado(producto: ProductoCandy): Promise<void> {
    const resultado = await this.candyService.cambiarEstadoProducto(producto.id, !producto.activo);

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    await this.cargarDatos();
  }

  obtenerNombreCategoria(categoriaId: string): string {
    return (
      this.categorias().find((categoria) => categoria.id === categoriaId)?.nombre || 'Sin categoría'
    );
  }

  obtenerCantidadCombo(productoId: string): number {
    return this.cantidadesCombo()[productoId] || 0;
  }

  cambiarCantidadCombo(productoId: string, cantidad: number): void {
    const cantidades = { ...this.cantidadesCombo() };

    if (cantidad <= 0) {
      delete cantidades[productoId];
    } else {
      cantidades[productoId] = cantidad;
    }

    this.cantidadesCombo.set(cantidades);
  }

  seleccionarImagenProducto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      this.abrirModal(
        'Archivo no válido',
        'Seleccioná un archivo de imagen válido para el producto.',
        'error',
      );

      input.value = '';
      return;
    }

    this.archivoProducto = archivo;

    if (this.vistaPreviaProducto) {
      URL.revokeObjectURL(this.vistaPreviaProducto);
    }

    this.vistaPreviaProducto = URL.createObjectURL(archivo);
  }

  seleccionarImagenCombo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      this.abrirModal(
        'Archivo no válido',
        'Seleccioná un archivo de imagen válido para el combo.',
        'error',
      );
      input.value = '';
      return;
    }

    this.archivoCombo = archivo;

    if (this.vistaPreviaCombo) {
      URL.revokeObjectURL(this.vistaPreviaCombo);
    }

    this.vistaPreviaCombo = URL.createObjectURL(archivo);
  }

  comenzarEditarCombo(combo: Combo): void {
    this.comboEditandoId = combo.id;
    this.cantidadesCombo.set({});

    this.comboService.obtenerProductosDelCombo(combo.id).then((productos) => {
      const cantidades: Record<string, number> = {};

      productos.forEach((producto) => {
        cantidades[producto.productoId] = producto.cantidad;
      });

      this.cantidadesCombo.set(cantidades);
    });
  }

  cancelarEditarCombo(): void {
    this.comboEditandoId = null;
    this.cantidadesCombo.set({});
  }

  async crearCombo(): Promise<void> {
    if (!this.nuevoCombo.nombre.trim()) {
      this.abrirModal('Datos incompletos', 'Ingresá el nombre del combo.', 'error');
      return;
    }

    if (this.nuevoCombo.precio <= 0) {
      this.abrirModal('Precio inválido', 'El precio del combo debe ser mayor a cero.', 'error');
      return;
    }

    if (this.nuevoCombo.cantidadEntradas <= 0) {
      this.abrirModal('Entradas inválidas', 'El combo debe incluir al menos una entrada.', 'error');
      return;
    }

    if (!this.archivoCombo) {
      this.abrirModal('Falta la imagen', 'Seleccioná una imagen para el combo.', 'error');
      return;
    }

    const productos = Object.entries(this.cantidadesCombo()).map(([productoId, cantidad]) => ({
      productoId,
      cantidad,
    }));

    const comboId = crypto.randomUUID();

    this.subiendoCombo = true;

    const imagenUrl = await this.peliculasService.subirPortada(this.archivoCombo, comboId);

    if (!imagenUrl) {
      this.subiendoCombo = false;

      this.abrirModal('Error al subir la imagen', 'No se pudo subir la imagen del combo.', 'error');

      return;
    }

    const resultado = await this.comboService.crearCombo(
      {
        ...this.nuevoCombo,
        imagenUrl,
      },
      productos,
    );

    this.subiendoCombo = false;

    if (!resultado.exito) {
      this.abrirModal(
        'Error al guardar',
        resultado.mensaje || 'No se pudo guardar el combo.',
        'error',
      );
      return;
    }

    this.abrirModal(
      '¡Combo creado!',
      'El combo fue creado correctamente y ya tiene su imagen cargada.',
      'exito',
    );

    this.nuevoCombo = {
      nombre: '',
      descripcion: '',
      precio: 0,
      cantidadEntradas: 1,
      imagenUrl: '',
      activo: true,
    };

    this.cantidadesCombo.set({});
    this.archivoCombo = null;

    if (this.vistaPreviaCombo) {
      URL.revokeObjectURL(this.vistaPreviaCombo);
    }

    this.vistaPreviaCombo = null;

    await this.cargarDatos();
  }

  async guardarCombo(combo: Combo): Promise<void> {
    const productos = Object.entries(this.cantidadesCombo()).map(([productoId, cantidad]) => ({
      productoId,
      cantidad,
    }));

    const resultado = await this.comboService.actualizarCombo(combo, productos);

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    this.cancelarEditarCombo();
    await this.cargarDatos();
  }

  async cambiarEstadoCombo(combo: Combo): Promise<void> {
    const resultado = await this.comboService.cambiarEstadoCombo(combo.id, !combo.activo);

    this.mostrarMensaje(resultado.mensaje, resultado.exito ? 'ok' : 'error');

    if (!resultado.exito) {
      return;
    }

    await this.cargarDatos();
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
