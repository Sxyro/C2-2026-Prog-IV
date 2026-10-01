import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CandyService } from '../../../core/services/candy.service';
import { CategoriaCandy, ProductoCandy } from '../../../core/models/producto-candy.model';

@Component({
  selector: 'app-candy-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candy-admin.component.html',
  styleUrl: './candy-admin.component.css',
})
export class CandyAdminComponent implements OnInit {
  private candyService = inject(CandyService);

  public categorias = signal<CategoriaCandy[]>([]);

  public productos = signal<ProductoCandy[]>([]);

  public nombreNuevaCategoria = '';

  public categoriaEditandoId: string | null = null;

  public nombreCategoriaEditando = '';

  public productoEditandoId: string | null = null;

  public nuevoProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoriaId: '',
    imagenUrl: '',
    activo: true,
  };

  public mensaje = signal<string | null>(null);

  public tipoMensaje = signal<'ok' | 'error'>('ok');

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    const [categorias, productos] = await Promise.all([
      this.candyService.obtenerCategorias(),

      this.candyService.obtenerTodosLosProductos(),
    ]);

    this.categorias.set(categorias);

    this.productos.set(productos);

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

    const resultado = await this.candyService.crearProducto(this.nuevoProducto);

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
    };

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
}
