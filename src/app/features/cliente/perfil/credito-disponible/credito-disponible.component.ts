import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../../../core/services/supabase.service';
import { UsuariosService } from '../../../../core/services/usuarios.service';

interface MovimientoCredito {
  id: string;
  tipo: 'credito' | 'uso';
  monto: number;
  descripcion: string;
  pelicula_nombre: string;
  reserva_id: string;
  created_at: string;
}

@Component({
  selector: 'app-credito-disponible',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './credito-disponible.component.html',
  styleUrl: './credito-disponible.component.css',
})
export class CreditoDisponibleComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public usuarioActual = this.usuariosService.obtenerUsuarioActual();

  public movimientos: MovimientoCredito[] = [];
  public cargando = signal(true);

  public totalCreditoObtenido = 0;
  public totalCreditoUsado = 0;

  async ngOnInit(): Promise<void> {
    await this.usuariosService.esperarSesionLista();

    const usuario = this.usuarioActual();

    if (!usuario) {
      this.cargando.set(false);
      await this.router.navigate(['/login']);
      return;
    }

    await this.cargarMovimientos();
  }

  private async cargarMovimientos(): Promise<void> {
    try {
      const { data, error } = await this.supabase.rpc('obtener_mis_movimientos_credito');

      if (error) {
        console.error('Error al obtener movimientos de crédito:', error.message);
        this.movimientos = [];
        return;
      }

      this.movimientos = (data || []).map((movimiento: any) => ({
        id: movimiento.id,
        tipo: movimiento.tipo as 'credito' | 'uso',
        monto: Number(movimiento.monto || 0),
        descripcion: movimiento.descripcion,
        pelicula_nombre: movimiento.pelicula_nombre,
        reserva_id: movimiento.reserva_id,
        created_at: movimiento.created_at,
      }));

      this.totalCreditoObtenido = this.movimientos
        .filter((movimiento) => movimiento.tipo === 'credito')
        .reduce((total, movimiento) => total + movimiento.monto, 0);

      this.totalCreditoUsado = this.movimientos
        .filter((movimiento) => movimiento.tipo === 'uso')
        .reduce((total, movimiento) => total + movimiento.monto, 0);
    } catch (error) {
      console.error('Error inesperado al cargar crédito:', error);
      this.movimientos = [];
    } finally {
      this.cargando.set(false);
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

  formatearDinero(valor: number): string {
    return valor.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
    return tipo === 'credito'
      ? 'movimiento-credito'
      : 'movimiento-uso';
  }
}