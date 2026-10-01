import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

import {
  PuntosService,
  RecompensaPuntos,
  CanjePuntos,
} from '../../../core/services/puntos.service';

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
  private puntosService = inject(PuntosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  public puntos = 0;
  public movimientos: MovimientoPuntos[] = [];

  public recompensas: RecompensaPuntos[] = [];
  public historialCanjes: CanjePuntos[] = [];

  public cargando = signal(true);
  public cargandoRecompensas = signal(false);

  public mostrarRecompensas = false;
  public canjeandoId: string | null = null;

  public mensajeRecompensa = '';
  public tipoMensajeRecompensa: 'exito' | 'error' = 'exito';

  public mostrarModalCanje = false;
  public recompensaPendiente: RecompensaPuntos | null = null;

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
        this.supabase.rpc('obtener_mis_puntos'),
        this.supabase.rpc('obtener_mis_movimientos'),
      ]);

      if (puntosResultado.error) {
        console.error('Error al obtener puntos:', puntosResultado.error.message);

        this.puntos = 0;
      } else {
        this.puntos = puntosResultado.data?.puntos ?? 0;
      }

      if (movimientosResultado.error) {
        console.error('Error al obtener historial de puntos:', movimientosResultado.error.message);

        this.movimientos = [];
      } else {
        this.movimientos = (movimientosResultado.data || []) as MovimientoPuntos[];
      }
    } catch (error) {
      console.error('Error inesperado al cargar fidelización:', error);

      this.puntos = 0;
      this.movimientos = [];
    } finally {
      this.cargando.set(false);
      this.cdr.detectChanges();
    }
  }

  async abrirRecompensas(): Promise<void> {
    this.mostrarRecompensas = !this.mostrarRecompensas;

    if (!this.mostrarRecompensas) {
      this.cdr.detectChanges();
      return;
    }

    if (this.recompensas.length === 0) {
      this.cargandoRecompensas.set(true);
      this.cdr.detectChanges();

      try {
        const usuario = this.usuarioActual();

        this.recompensas = await this.puntosService.obtenerRecompensas();

        if (usuario) {
          this.historialCanjes = await this.puntosService.obtenerHistorialCanjes(usuario.id);
        }
      } catch (error) {
        console.error('Error al cargar recompensas:', error);

        this.recompensas = [];
        this.historialCanjes = [];
      } finally {
        this.cargandoRecompensas.set(false);
        this.cdr.detectChanges();
      }
    }

    setTimeout(() => {
      document.getElementById('seccion-recompensas')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  async canjearRecompensa(recompensa: RecompensaPuntos): Promise<void> {
    if (this.canjeandoId) {
      return;
    }

    if (this.puntos < recompensa.puntosRequeridos) {
      this.mostrarMensajeRecompensa(
        `Necesitás ${recompensa.puntosRequeridos.toLocaleString(
          'es-AR',
        )} puntos para canjear esta recompensa.`,
        false,
      );

      return;
    }

    this.recompensaPendiente = recompensa;
    this.mostrarModalCanje = true;

    this.cdr.detectChanges();
  }

  cerrarModalCanje(): void {
    if (this.canjeandoId) {
      return;
    }

    this.mostrarModalCanje = false;
    this.recompensaPendiente = null;

    this.cdr.detectChanges();
  }

  async confirmarCanje(): Promise<void> {
    if (!this.recompensaPendiente || this.canjeandoId) {
      return;
    }

    const recompensa = this.recompensaPendiente;

    this.canjeandoId = recompensa.id;
    this.mostrarModalCanje = false;
    this.mensajeRecompensa = '';

    this.cdr.detectChanges();

    try {
      const resultado = await this.puntosService.canjearRecompensa(recompensa.id);

      if (!resultado.exito) {
        this.mostrarMensajeRecompensa(resultado.mensaje, false);

        this.canjeandoId = null;
        this.recompensaPendiente = null;

        this.cdr.detectChanges();

        return;
      }

      if (resultado.puntosRestantes !== undefined) {
        this.puntos = resultado.puntosRestantes;
      }

      this.canjeandoId = null;
      this.recompensaPendiente = null;

      this.mostrarMensajeRecompensa(resultado.mensaje, true);

      this.cdr.detectChanges();

      const usuario = this.usuarioActual();

      if (usuario) {
        this.historialCanjes = await this.puntosService.obtenerHistorialCanjes(usuario.id);

        const movimientosResultado = await this.supabase.rpc('obtener_mis_movimientos');

        if (!movimientosResultado.error) {
          this.movimientos = (movimientosResultado.data || []) as MovimientoPuntos[];
        }
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al canjear recompensa:', error);

      this.canjeandoId = null;
      this.recompensaPendiente = null;

      this.mostrarMensajeRecompensa('No se pudo realizar el canje.', false);

      this.cdr.detectChanges();
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

  mostrarMensajeRecompensa(mensaje: string, exito: boolean): void {
    this.mensajeRecompensa = mensaje;
    this.tipoMensajeRecompensa = exito ? 'exito' : 'error';

    this.cdr.detectChanges();

    setTimeout(() => {
      this.mensajeRecompensa = '';

      this.cdr.detectChanges();
    }, 4000);
  }
}
