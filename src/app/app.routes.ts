import { Routes } from '@angular/router';
import { CarteleraComponent } from './features/cliente/cartelera/cartelera.component';
import { RegistroComponent } from './features/cliente/registro/registro.component';
import { ReservaComponent } from './features/cliente/reserva/reserva.component';
import { LoginComponent } from './features/cliente/login/login.component';
import { soloAdminGuard } from './core/guards/admin.guard';
import { adminGuard } from './core/guards/admin.guard';
import { EscanearComponent } from './features/empleado/escanear.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cartelera', pathMatch: 'full' },
  { path: 'cartelera', component: CarteleraComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'reserva/:idPelicula', component: ReservaComponent },
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
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [soloAdminGuard],
  },
  { path: '**', redirectTo: 'cartelera' },
];
