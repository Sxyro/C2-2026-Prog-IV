export type RolUsuario = 'usuario' | 'empleado' | 'admin';

export interface Usuario {
  id: string;
  authUserId: string;
  email: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  tipoSangre: string;
  colorOjos: string;
  diasVacaciones: number;
  tieneDescuentoPrimeraCompra: boolean;
  rol: RolUsuario;
}