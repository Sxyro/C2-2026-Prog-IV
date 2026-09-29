import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-escanear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escanear.component.html',
  styleUrl: './escanear.component.css',
})
export class EscanearComponent implements OnDestroy {
  private supabase = inject(SupabaseService).client;

  @ViewChild('video')
  videoElement?: ElementRef<HTMLVideoElement>;

  public codigoManual = '';
  public escaneando = signal(false);
  public procesando = signal(false);
  public mensaje = signal<string | null>(null);
  public tipoMensaje = signal<'exito' | 'error' | 'info' | null>(null);

  private controlesCamara: { stop: () => void } | null = null;

  async iniciarCamara(): Promise<void> {
    if (!this.videoElement?.nativeElement) {
      return;
    }

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');

      const lector = new BrowserQRCodeReader();

      this.escaneando.set(true);
      this.mensaje.set(null);
      this.tipoMensaje.set(null);

      this.controlesCamara = await lector.decodeFromVideoDevice(
        undefined,
        this.videoElement.nativeElement,
        async (resultado) => {
          if (!resultado || this.procesando()) {
            return;
          }

          const contenido = resultado.getText();

          this.detenerCamara();

          await this.procesarCodigo(contenido);
        },
      );
    } catch {
      this.escaneando.set(false);
      this.mensaje.set('No se pudo acceder a la cámara.');
      this.tipoMensaje.set('error');
    }
  }

  detenerCamara(): void {
    this.controlesCamara?.stop();
    this.controlesCamara = null;
    this.escaneando.set(false);
  }

  async validarCodigoManual(): Promise<void> {
    const codigo = this.codigoManual.trim().toUpperCase();

    if (!codigo) {
      this.mensaje.set('Ingresá un código.');
      this.tipoMensaje.set('error');
      return;
    }

    this.procesando.set(true);
    this.mensaje.set('Validando código...');
    this.tipoMensaje.set('info');

    const { data, error } = await this.supabase.rpc(
      'validar_entrada_codigo',
      {
        p_codigo: codigo,
      },
    );

    this.procesando.set(false);

    if (error) {
      this.mensaje.set('Ocurrió un error al validar el código.');
      this.tipoMensaje.set('error');
      return;
    }

    const resultado = data?.[0];

    if (!resultado?.exito) {
      this.mensaje.set(
        resultado?.mensaje || 'No se pudo validar el código.',
      );
      this.tipoMensaje.set('error');
      return;
    }

    this.mensaje.set(resultado.mensaje);
    this.tipoMensaje.set('exito');
    this.codigoManual = '';
  }

  private async procesarCodigo(contenido: string): Promise<void> {
    const reservaId = this.extraerReservaId(contenido);

    if (!reservaId) {
      this.mensaje.set('El código QR no contiene una reserva válida.');
      this.tipoMensaje.set('error');
      return;
    }

    this.procesando.set(true);
    this.mensaje.set('Validando entrada...');
    this.tipoMensaje.set('info');

    const { data, error } = await this.supabase.rpc(
      'validar_entrada_qr',
      {
        p_reserva_id: reservaId,
      },
    );

    this.procesando.set(false);

    if (error) {
      this.mensaje.set('Ocurrió un error al validar el código.');
      this.tipoMensaje.set('error');
      return;
    }

    const resultado = data?.[0];

    if (!resultado?.exito) {
      this.mensaje.set(
        resultado?.mensaje || 'No se pudo validar la entrada.',
      );
      this.tipoMensaje.set('error');
      return;
    }

    this.mensaje.set(resultado.mensaje);
    this.tipoMensaje.set('exito');
    this.codigoManual = '';
  }

  private extraerReservaId(contenido: string): string | null {
    const texto = contenido.trim();

    const uuid = texto.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    );

    return uuid ? uuid[0] : null;
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }
}