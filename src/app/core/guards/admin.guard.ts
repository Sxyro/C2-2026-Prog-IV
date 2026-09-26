import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const esAdmin = true; //  Pendiente autenticar correctamente si es admin o no

  if (esAdmin) {
    return true;
  } else {
    alert('No tenés permisos para acceder al panel de administración.');
    router.navigate(['/cartelera']);
    return false;
  }
};