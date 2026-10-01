import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

interface MovimientoPuntos {
  id: string;
  usuario_id: string;
  reserva_id: string | null;
  tipo: 'ganancia' | 'canje' | 'ajuste';
  puntos: number;
  descripcion: string;
  created_at: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);

  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  public puntos = 0;
  public movimientos: MovimientoPuntos[] = [];
  public cargando = signal(true);

  async ngOnInit(): Promise<void> {
    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuarioActual();

    if (!usuario) {
      this.cargando.set(false);
      await this.router.navigate(['/login']);
      return;
    }

    await this.cargarDatosFidelizacion();
  }

  private async cargarDatosFidelizacion(): Promise<void> {
    const usuario = this.usuarioActual();

    if (!usuario) {
      this.cargando.set(false);
      return;
    }

    try {
      const [puntosResultado, movimientosResultado] = await Promise.all([
        this.supabase
          .from('puntos_usuarios')
          .select('usuario_id, puntos, updated_at')
          .eq('usuario_id', usuario.id)
          .maybeSingle(),

        this.supabase
          .from('movimientos_puntos')
          .select(
            'id, usuario_id, reserva_id, tipo, puntos, descripcion, created_at',
          )
          .eq('usuario_id', usuario.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (puntosResultado.error) {
        console.error(
          'Error al obtener puntos:',
          puntosResultado.error.message,
        );
        this.puntos = 0;
      } else {
        this.puntos = puntosResultado.data?.puntos ?? 0;
      }

      if (movimientosResultado.error) {
        console.error(
          'Error al obtener historial de puntos:',
          movimientosResultado.error.message,
        );
        this.movimientos = [];
      } else {
        this.movimientos = movimientosResultado.data ?? [];
      }
    } catch (error) {
      console.error('Error inesperado al cargar fidelización:', error);
      this.puntos = 0;
      this.movimientos = [];
    } finally {
      this.cargando.set(false);
    }
  }

  obtenerNombreCompleto(): string {
    const usuario = this.usuarioActual();

    if (!usuario) {
      return '';
    }

    return `${usuario.nombre} ${usuario.apellido}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  obtenerClaseMovimiento(tipo: string): string {
    if (tipo === 'ganancia') {
      return 'movimiento-ganancia';
    }

    if (tipo === 'canje') {
      return 'movimiento-canje';
    }

    return 'movimiento-ajuste';
  }

  obtenerSignoMovimiento(tipo: string): string {
    return tipo === 'ganancia' ? '+' : '';
  }
}