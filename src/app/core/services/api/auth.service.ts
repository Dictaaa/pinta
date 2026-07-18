// src/app/core/services/api/auth.service.ts
// ÚNICO AuthService del proyecto.
// Borrar src/app/core/services/auth.ts (el mock) y
// apuntar todos los imports a este archivo.
import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';

export interface SessionUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
}

export interface SessionShop {
  id: number;
  slug: string;
  name: string;
  status: string;
  verified: boolean;
}

/** Slugs que ninguna tienda puede usar — espejo del backend */
export const SLUGS_RESERVADOS = [
  'carrito', 'producto', 'favoritos', 'cuenta', 'tiendas',
  'iniciar-sesion', 'registro', 'dashboard', 'catalogo', 'checkout',
  'mujer', 'hombre', 'ninos', 'admin', 'api', 'ayuda',
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);

  /* ── Estado reactivo (hidratado desde localStorage) ── */
  private _user = signal<SessionUser | null>(this.leer('user'));
  private _shop = signal<SessionShop | null>(this.leer('shop'));

  readonly user = this._user.asReadonly();
  readonly shop = this._shop.asReadonly();
  readonly estaAutenticado = computed(
    () => this._user() !== null && !!localStorage.getItem('token'),
  );

  /* ── API ────────────────────────────────────── */
  login(email: string, password: string) {
    return this.api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
  }

  register(body: any) {
    return this.api.post(ENDPOINTS.AUTH.REGISTER, body);
  }

  slugAvailable(slug: string) {
    return this.api.get(ENDPOINTS.AUTH.SLUG_AVAILABLE(slug));
  }

  /* ── Sesión ─────────────────────────────────── */
  saveSession(token: string, user: SessionUser, shop: SessionShop | null) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (shop) localStorage.setItem('shop', JSON.stringify(shop));
    else localStorage.removeItem('shop');

    this._user.set(user);
    this._shop.set(shop);
  }

  logout() {
    // Solo la sesión — nunca localStorage.clear(),
    // que borraría también el carrito y otros datos
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop');

    this._user.set(null);
    this._shop.set(null);
  }

  /* ── Lecturas puntuales (guards, ApiService) ── */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): SessionUser | null {
    return this._user();
  }

  getShop(): SessionShop | null {
    return this._shop();
  }

  getRole(): number {
    return this._user()?.role_id ?? 0;
  }

  hasRole(roles: number[]): boolean {
    return roles.includes(this.getRole());
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /* ── Helpers de slug (los usa el registro) ──── */
  generarSlug(nombreTienda: string): string {
    return nombreTienda
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/gi, 'n')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '');
  }

  esSlugReservado(slug: string): boolean {
    return SLUGS_RESERVADOS.includes(slug.toLowerCase());
  }

  /* ── Persistencia ───────────────────────────── */
  private leer<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  getCities() {
  return this.api.get(ENDPOINTS.AUTH.CITIES);
}
}