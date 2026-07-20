// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { shopOwnerGuard } from './core/guards/shop-owner-guard';

export const routes: Routes = [
  // ── Home / landing ──────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home/home').then(m => m.Home),
  },

  // ── Rutas fijas — SIEMPRE antes de :slug ────────────
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
    path: 'carrito',
    loadComponent: () =>
      import('./features/cart/pages/cart/cart').then(m => m.Cart),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/pages/checkout/checkout').then(m => m.Checkout),
  },

  // ── Compatibilidad: /dashboard sin slug redirige ────
  // (links viejos, marcadores, el navigate del login si no lo cambias)
  { path: 'dashboard', redirectTo: '' },

  // ═════════════════════════════════════════════════════
  //  TODO LO DE UNA TIENDA VIVE BAJO SU SLUG
  //  lapintaco.com/MiTienda/...
  //  SIEMPRE al final — captura cualquier :slug
  // ═════════════════════════════════════════════════════
  {
    path: ':slug',
    children: [
      // ── Público (clientes) ──
      { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./features/store/pages/store/store').then(m => m.Store),
      },
      {
        path: 'producto/:id',
        loadComponent: () =>
          import('./features/product/pages/product/product').then(m => m.Product),
      },

      // ── Privado (dueño de ESTA tienda) ──
      {
        path: 'dashboard',
        canActivate: [shopOwnerGuard],
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'productos',
        canActivate: [shopOwnerGuard],
        loadComponent: () =>
          import('./features/dashboard/pages/products/products').then(m => m.Products),
      },
      // en app.routes.ts, dentro de children de :slug:
      {
        path: 'plan',
        canActivate: [shopOwnerGuard],
        loadComponent: () =>
          import('./features/dashboard/pages/plan/plan').then(m => m.Plan),
      },
      {
        path: 'pedidos',
        canActivate: [shopOwnerGuard],
        loadComponent: () =>
          import('./features/dashboard/pages/orders/orders').then(m => m.Orders),
      }
    ],
  },

  { path: '**', redirectTo: '' },
];