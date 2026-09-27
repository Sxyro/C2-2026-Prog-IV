import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StaffService } from '../services/staff.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const staffService = inject(StaffService);
  const router = inject(Router);

  await staffService.esperarSesionLista();

  if (staffService.esEmpleadoOAdmin()) {
    return true;
  }

  router.navigate(['/admin/login'], { queryParams: { redirect: state.url } });
  return false;
};

export const soloAdminGuard: CanActivateFn = async (route, state) => {
  const staffService = inject(StaffService);
  const router = inject(Router);

  await staffService.esperarSesionLista();

  if (staffService.esAdmin()) {
    return true;
  }

  router.navigate(['/admin/login'], { queryParams: { redirect: state.url } });
  return false;
};
