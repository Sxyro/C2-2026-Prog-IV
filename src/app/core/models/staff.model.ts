export type RolStaff = 'admin' | 'empleado';

export interface Staff {
  id: string;
  nombre: string;
  rol: RolStaff;
}
