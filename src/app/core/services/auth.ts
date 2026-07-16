import { Injectable, computed, signal } from '@angular/core';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  tienda: {
    slug: string;
    nombre: string;
    ciudad: string;
  };
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  nombreTienda: string;
  slug: string;
  ciudad: string;
}

/** Slugs que ninguna tienda puede usar — coinciden con rutas fijas de la app */
export const SLUGS_RESERVADOS = [
  'carrito', 'producto', 'favoritos', 'cuenta', 'tiendas',
  'iniciar-sesion', 'registro', 'dashboard', 'checkout',
  'mujer', 'hombre', 'ninos', 'admin', 'api', 'ayuda',
];

const STORAGE_KEY = 'pinta_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _usuario = signal<Usuario | null>(this.leerSesion());

  readonly usuario = this._usuario.asReadonly();
  readonly estaAutenticado = computed(() => this._usuario() !== null);

  /* ── Login (mock — reemplazar por POST /auth/login) ── */
  async login(email: string, _password: string): Promise<Usuario> {
    // TODO: llamada real al backend con manejo de credenciales inválidas
    await this.delay(600);

    const usuario: Usuario = {
      id: 1,
      nombre: email.split('@')[0],
      email,
      tienda: { slug: 'ModaLuna', nombre: 'ModaLuna', ciudad: 'Bogotá' },
    };

    this.guardarSesion(usuario);
    return usuario;
  }

  /* ── Registro (mock — reemplazar por POST /auth/registro) ── */
  async registrar(datos: DatosRegistro): Promise<Usuario> {
    // TODO: el backend debe validar email único y slug único
    await this.delay(800);

    const usuario: Usuario = {
      id: Date.now(),
      nombre: datos.nombre,
      email: datos.email,
      tienda: {
        slug: datos.slug,
        nombre: datos.nombreTienda,
        ciudad: datos.ciudad,
      },
    };

    this.guardarSesion(usuario);
    return usuario;
  }

  logout(): void {
    this._usuario.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ── Slug ───────────────────────────────────── */
  generarSlug(nombreTienda: string): string {
    return nombreTienda
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // quitar tildes
      .replace(/ñ/gi, 'n')
      .replace(/[^a-zA-Z0-9\s-]/g, '')   // solo alfanumérico
      .trim()
      .replace(/\s+/g, '');              // sin espacios → CamelCase natural
  }

  slugDisponible(slug: string): boolean {
    // TODO: consultar disponibilidad real en el backend
    return !SLUGS_RESERVADOS.includes(slug.toLowerCase());
  }

  /* ── Persistencia ───────────────────────────── */
  private guardarSesion(usuario: Usuario): void {
    this._usuario.set(usuario);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  }

  private leerSesion(): Usuario | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }
}