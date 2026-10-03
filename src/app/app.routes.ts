import { Routes } from '@angular/router';

import { CarteleraComponent } from './features/cliente/cartelera/cartelera.component';
import { RegistroComponent } from './features/cliente/registro/registro.component';
import { ReservaComponent } from './features/cliente/reserva/reserva.component';
import { LoginComponent } from './features/cliente/login/login.component';

import { soloAdminGuard, adminGuard } from './core/guards/admin.guard';

import { PerfilComponent } from './features/cliente/perfil/mi-perfil-info/perfil.component';
import { MisPeliculasComponent } from './features/cliente/perfil/mis-peliculas/mis-peliculas.component';
import { RecompensasComponent } from './features/cliente/perfil/recompensas/recompensas.component';
import { CreditoDisponibleComponent } from './features/cliente/perfil/credito-disponible/credito-disponible.component';

import { EscanearComponent } from './features/empleado/escanear.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cartelera', pathMatch: 'full' },

  { path: 'cartelera', component: CarteleraComponent },

  { path: 'login', component: LoginComponent },

  { path: 'registro', component: RegistroComponent },

  {
    path: 'perfil',
    component: PerfilComponent,
  },

  {
    path: 'perfil/mis-peliculas',
    component: MisPeliculasComponent,
  },

  {
    path: 'perfil/recompensas',
    component: RecompensasComponent,
  },

  {
    path: 'perfil/credito-disponible',
    component: CreditoDisponibleComponent,
  },

  {
    path: 'reserva/:idPelicula',
    component: ReservaComponent,
  },

  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/cliente/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },

  {
    path: 'escanear',
    component: EscanearComponent,
    canActivate: [adminGuard],
  },

  {
    path: 'admin',
    canActivate: [soloAdminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/panel-admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'funciones',
        loadComponent: () =>
          import('./features/admin/funciones/funciones-admin.component').then(
            (m) => m.FuncionesAdminComponent,
          ),
      },
      {
        path: 'peliculas',
        loadComponent: () =>
          import('./features/admin/peliculas/peliculas-admin.component').then(
            (m) => m.PeliculasAdminComponent,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios-admin.component').then(
            (m) => m.UsuariosAdminComponent,
          ),
      },
      {
        path: 'descuentos',
        loadComponent: () =>
          import('./features/admin/descuentos/descuentos-admin.component').then(
            (m) => m.DescuentosAdminComponent,
          ),
      },
      {
        path: 'candy',
        loadComponent: () =>
          import('./features/admin/candy/candy-admin.component').then((m) => m.CandyAdminComponent),
      },
      {
        path: 'recompensas',
        loadComponent: () =>
          import('./features/admin/recompensas/recompensas-admin.component').then(
            (m) => m.RecompensasAdminComponent,
          ),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin/reportes/reportes-admin.component').then(
            (m) => m.ReportesAdminComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'cartelera' },
];
