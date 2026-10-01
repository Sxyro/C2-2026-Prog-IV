import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  UsuariosService,
  UsuarioAdministrable
} from '../../../core/services/usuarios.service';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './usuarios-admin.component.html',
  styleUrl: './usuarios-admin.component.css',
})
export class UsuariosAdminComponent implements OnInit {
  private usuariosService = inject(UsuariosService);

  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  public usuariosAdministrables = signal<UsuarioAdministrable[]>([]);
  public cargandoUsuarios = signal(false);
  public usuarioModificandoRol = signal<string | null>(null);

  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  async ngOnInit(): Promise<void> {
    await this.cargarUsuarios();
  }

  async cargarUsuarios(): Promise<void> {
    this.cargandoUsuarios.set(true);

    const usuarios = await this.usuariosService.obtenerUsuariosAdmin();
    const usuarioActualId = this.usuarioActual()?.id;

    const usuariosOrdenados = [...usuarios].sort((a, b) => {
      if (a.id === usuarioActualId) return -1;
      if (b.id === usuarioActualId) return 1;
      return 0;
    });

    this.usuariosAdministrables.set(usuariosOrdenados);
    this.cargandoUsuarios.set(false);
  }

  async cambiarRolUsuario(
    usuario: UsuarioAdministrable,
    nuevoRol: string
  ): Promise<void> {
    const rol = nuevoRol as UsuarioAdministrable['rol'];

    if (usuario.rol === rol) return;

    this.usuarioModificandoRol.set(usuario.id);

    const resultado = await this.usuariosService.actualizarRolUsuario(
      usuario.id,
      rol
    );

    this.usuarioModificandoRol.set(null);

    if (!resultado.exito) {
      this.abrirModal(
        'No se pudo actualizar el rol',
        resultado.mensaje || 'Ocurrió un error al actualizar el rol del usuario.',
        'error'
      );
      return;
    }

    this.abrirModal(
      'Rol actualizado',
      `El rol de ${usuario.nombre} ${usuario.apellido} fue actualizado correctamente.`,
      'exito'
    );

    await this.cargarUsuarios();
  }

  abrirModal(
    titulo: string,
    mensaje: string,
    tipo: 'error' | 'exito' = 'error'
  ): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }
}