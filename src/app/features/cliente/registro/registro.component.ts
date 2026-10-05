import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';

interface DiaNacimiento {
  fecha: Date;
  numero: number;
  esDelMesActual: boolean;
  esHoy: boolean;
  esSeleccionado: boolean;
  esFuturo: boolean;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private configuracionService = inject(ConfiguracionService);
  private router = inject(Router);

  public configuracion = this.configuracionService.obtenerConfiguracion();

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    tipoSangre: ['A+', [Validators.required]],
    colorOjos: ['', [Validators.required]],
    diasVacaciones: [0, [Validators.required, Validators.min(0)]],
  });

  public calendarioAbierto = false;
  public selectorAnioAbierto = false;
  public mesCalendario = new Date().getMonth();
  public anioCalendario = new Date().getFullYear();
  public aniosDisponibles: number[] = [];
  public modalAbierto = false;
  public modalTitulo = '';
  public modalMensaje = '';
  public modalTipo: 'error' | 'exito' = 'error';

  private diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  constructor() {
    this.generarAniosDisponibles();
  }

  private generarAniosDisponibles(): void {
    const anioActual = new Date().getFullYear();

    for (let anio = anioActual; anio >= 1900; anio--) {
      this.aniosDisponibles.push(anio);
    }
  }

  obtenerNombreMes(): string {
    const fecha = new Date(this.anioCalendario, this.mesCalendario, 1);

    return fecha
      .toLocaleDateString('es-AR', {
        month: 'long',
      })
      .replace(/^./, (letra) => letra.toUpperCase());
  }

  obtenerDiasCalendario(): DiaNacimiento[] {
    const primerDia = new Date(this.anioCalendario, this.mesCalendario, 1);
    const ultimoDia = new Date(this.anioCalendario, this.mesCalendario + 1, 0);

    let primerDiaSemana = primerDia.getDay();

    if (primerDiaSemana === 0) {
      primerDiaSemana = 7;
    }

    const dias: DiaNacimiento[] = [];
    const diasAnteriores = primerDiaSemana - 1;

    for (let i = diasAnteriores; i > 0; i--) {
      const fecha = new Date(this.anioCalendario, this.mesCalendario, 1 - i);
      dias.push(this.crearDiaCalendario(fecha, false));
    }

    for (let numero = 1; numero <= ultimoDia.getDate(); numero++) {
      const fecha = new Date(this.anioCalendario, this.mesCalendario, numero);
      dias.push(this.crearDiaCalendario(fecha, true));
    }

    const diasRestantes = 42 - dias.length;

    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(this.anioCalendario, this.mesCalendario + 1, i);
      dias.push(this.crearDiaCalendario(fecha, false));
    }

    return dias;
  }

  private crearDiaCalendario(fecha: Date, esDelMesActual: boolean): DiaNacimiento {
    const hoy = new Date();

    const fechaSinHora = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
    );

    const hoySinHora = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );

    return {
      fecha,
      numero: fecha.getDate(),
      esDelMesActual,
      esHoy: fechaSinHora.getTime() === hoySinHora.getTime(),
      esSeleccionado:
        this.form.get('fechaNacimiento')?.value === this.formatearFecha(fecha),
      esFuturo: fechaSinHora.getTime() > hoySinHora.getTime(),
    };
  }

  private formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  obtenerFechaFormateada(): string {
    const fecha = this.form.get('fechaNacimiento')?.value;

    if (!fecha) {
      return 'Seleccionar fecha';
    }

    const [anio, mes, dia] = fecha.split('-');

    return `${dia}/${mes}/${anio}`;
  }

  abrirCalendario(): void {
    this.selectorAnioAbierto = false;
    this.calendarioAbierto = !this.calendarioAbierto;

    const fechaActual = this.form.get('fechaNacimiento')?.value;

    if (this.calendarioAbierto && fechaActual) {
      const partes = fechaActual.split('-');
      this.anioCalendario = Number(partes[0]);
      this.mesCalendario = Number(partes[1]) - 1;
    }
  }

  seleccionarFecha(dia: DiaNacimiento): void {
    if (dia.esFuturo) {
      return;
    }

    this.form.patchValue({
      fechaNacimiento: this.formatearFecha(dia.fecha),
    });

    this.calendarioAbierto = false;
  }

  abrirSelectorAnio(): void {
    this.selectorAnioAbierto = !this.selectorAnioAbierto;
  }

  seleccionarAnio(anio: number): void {
    this.anioCalendario = anio;
    this.selectorAnioAbierto = false;
  }

  mesAnterior(): void {
    if (this.mesCalendario === 0) {
      this.mesCalendario = 11;
      this.anioCalendario--;
    } else {
      this.mesCalendario--;
    }
  }

  mesSiguiente(): void {
    const hoy = new Date();

    const siguienteMes =
      this.mesCalendario === 11 ? 0 : this.mesCalendario + 1;

    const siguienteAnio =
      this.mesCalendario === 11
        ? this.anioCalendario + 1
        : this.anioCalendario;

    if (
      siguienteAnio > hoy.getFullYear() ||
      (siguienteAnio === hoy.getFullYear() &&
        siguienteMes > hoy.getMonth())
    ) {
      return;
    }

    this.mesCalendario = siguienteMes;
    this.anioCalendario = siguienteAnio;
  }

  esMesActual(): boolean {
    const hoy = new Date();

    return (
      this.anioCalendario === hoy.getFullYear() &&
      this.mesCalendario === hoy.getMonth()
    );
  }

  volverAlMesActual(): void {
    const hoy = new Date();

    this.anioCalendario = hoy.getFullYear();
    this.mesCalendario = hoy.getMonth();
  }

  obtenerDiasSemana(): string[] {
    return this.diasSemana;
  }

  public async registrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();

    const resultado = await this.usuariosService.registrarUsuario({
      email: valor.email || '',
      password: valor.password || '',
      nombre: valor.nombre || '',
      apellido: valor.apellido || '',
      fechaNacimiento: valor.fechaNacimiento || '',
      tipoSangre: valor.tipoSangre || '',
      colorOjos: valor.colorOjos || '',
      diasVacaciones: valor.diasVacaciones || 0,
    });

    if (!resultado.exito) {
      this.abrirModal(
        'No se pudo completar el registro',
        resultado.mensaje || 'Ocurrió un error al intentar crear tu cuenta.',
        'error',
      );
      return;
    }

    this.form.reset({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      tipoSangre: 'A+',
      colorOjos: '',
      diasVacaciones: 0,
    });

    await this.router.navigate(['/cartelera']);
  }

  public omitirAnonimo(): void {
    this.usuariosService.continuarComoAnonimo();
    this.router.navigate(['/cartelera']);
  }

  abrirModal(
    titulo: string,
    mensaje: string,
    tipo: 'error' | 'exito' = 'error',
  ): void {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalTipo = tipo;
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    const eraExito = this.modalTipo === 'exito';

    this.modalAbierto = false;

    if (eraExito) {
      this.router.navigate(['/cartelera']);
    }
  }
}