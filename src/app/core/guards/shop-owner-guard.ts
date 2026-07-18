// src/app/core/guards/shop-owner-guard.ts
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

/**
 * Protege /:slug/dashboard y /:slug/productos.
 * Valida sesión Y que la tienda del usuario sea la del slug de la URL.
 */
export const shopOwnerGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/iniciar-sesion']);
  }

  const shop = auth.getShop();
  if (!shop?.slug) {
    // Sesión sin tienda (cliente, o sesión vieja sin shop guardado)
    return router.createUrlTree(['/']);
  }

  const slugUrl = (route.paramMap.get('slug') ?? '').toLowerCase();

  if (slugUrl !== shop.slug.toLowerCase()) {
    // Intentó entrar al panel de OTRA tienda → al suyo
    return router.createUrlTree(['/', shop.slug, 'dashboard']);
  }

  return true;
};