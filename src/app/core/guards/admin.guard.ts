import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);

  await usuariosService.esperarSesionLista();

  const usuario = usuariosService.obtenerUsuarioActual()();

  if (usuario?.rol === 'empleado' || usuario?.rol === 'admin') {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: { redirect: state.url }
  });

  return false;
};

export const soloAdminGuard: CanActivateFn = async (_route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);

  await usuariosService.esperarSesionLista();

  const usuario = usuariosService.obtenerUsuarioActual()();

  if (usuario?.rol === 'admin') {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: { redirect: state.url }
  });

  return false;
};