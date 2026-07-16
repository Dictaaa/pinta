import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // ── Home / marketplace ──────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home/home').then(m => m.Home),
  },

  {
  path: 'iniciar-sesion',
  loadComponent: () =>
    import('./features/auth/login/pages/login/login').then(m => m.Login),
},
{
  path: 'registro',
  loadComponent: () =>
    import('./features/auth/register/pages/register/register').then(m => m.Register),
},
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard),
},

  // ── Rutas fijas — SIEMPRE antes de :slug ────────────
  {
    path: 'carrito',
    loadComponent: () =>
      import('./features/cart/pages/cart/cart').then(m => m.Cart),
  },
  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./features/product/pages/product/product').then(m => m.Product),
  },

  // ── Perfil de la tienda → pinta.co/tienda ───────────
  // SIEMPRE al final — captura cualquier :slug no definido arriba
  {
    path: ':slug',
    loadComponent: () =>
      import('./features/store/pages/store/store').then(m => m.Store),
  },

  { path: '**', redirectTo: '' },
];