import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { StoreContextService } from '../../core/services/store-context';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth'; // ajusta si tu archivo se llama auth.service
import { UiService } from '../../core/services/ui';

type ModoNav = 'oculta' | 'landing' | 'dashboard' | 'compra' | 'productos';

@Component({
  selector: 'app-topnav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './topnav.html',
  styleUrl: './topnav.scss',
})
export class Topnav {
  private storeCtx = inject(StoreContextService);
  private router = inject(Router);
  cart = inject(CartService);
  auth = inject(AuthService);
  ui = inject(UiService);

  /** Tienda activa — null = modo marketplace */
  tienda = this.storeCtx.tiendaActual;

  navScrolled = signal(false);

  /** URL actual como signal */
  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Modo de la barra según la ruta */
  modo = computed<ModoNav>(() => {
  const url = this.url().split('?')[0];
  const segments = url.split('/').filter(Boolean);   // ['MiTienda','dashboard']

  if (url.startsWith('/iniciar-sesion') || url.startsWith('/registro')) return 'oculta';
  if (segments.length >= 2 && ['dashboard', 'productos', 'plan', 'pedidos'].includes(segments[1])) return 'dashboard';
  if (segments.length === 0) return 'landing';
  return 'compra';
});

  /** Título de la página actual (modo dashboard) */
  tituloPagina = computed(() => {
    const url = this.url().split('?')[0];
    const titulos: Record<string, string> = {
      '/dashboard': 'Panel',
      '/dashboard/productos': 'Productos',
      '/dashboard/pedidos': 'Pedidos',
      '/dashboard/perfil': 'Perfil de tienda',
      '/dashboard/plan': 'Mi plan',
    };
    return titulos[url] ?? 'Panel';
  });

  /** Inicial del usuario para el avatar */
  inicialUsuario = computed(() =>
    (this.auth.usuario()?.nombre?.[0] ?? '?').toUpperCase()
  );

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled.set(window.scrollY > 8);
  }
}