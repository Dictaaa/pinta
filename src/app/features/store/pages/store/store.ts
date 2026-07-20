// src/app/features/store/pages/store/store.ts
import {
  AfterViewInit, Component, DestroyRef, ElementRef, ViewChild,
  inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CategoryCount, CatalogQuery, PublicShop, ShopService,
} from '../../../../core/services/api/shop.service';
import { ApiProduct } from '../../../../core/services/product';
import { StoreContextService } from '../../../../core/services/store-context';

type Orden = 'relevancia' | 'ventas' | 'precio_asc' | 'precio_desc' | 'rating';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './store.html',
  styleUrl: './store.scss',
})
export class Store implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private shopService = inject(ShopService);
  private storeCtx = inject(StoreContextService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;

  /* ── Estado ─────────────────────────────────── */
  slugActual = '';
  tienda = signal<PublicShop | null>(null);
  categorias = signal<CategoryCount[]>([]);
  productos = signal<ApiProduct[]>([]);   // acumulado de las páginas ya pedidas

  cargando = signal(true);       // primera carga de la tienda
  cargandoMas = signal(false);   // cargando la siguiente página
  noEncontrada = signal(false);

  categoriaActiva = signal<string>('Todo');
  orden = signal<Orden>('relevancia');
  busqueda = signal('');
  favoritos = signal<Set<number>>(new Set());

  private page = signal(1);
  private hasMore = signal(false);
  private busquedaSubject = new Subject<string>();

  constructor() {
    // El componente se REUTILIZA al navegar entre slugs
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.cargarTienda(params.get('slug') ?? ''));

    // Búsqueda con debounce — cada tecla no dispara un request
    this.busquedaSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(texto => {
        this.busqueda.set(texto);
        this.reiniciarYcargar();
      });

    this.destroyRef.onDestroy(() => {
      this.storeCtx.clear();
      this.observer?.disconnect();
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && this.hasMore() && !this.cargandoMas()) {
          this.cargarSiguientePagina();
        }
      },
      { rootMargin: '400px' },
    );
    if (this.sentinel) this.observer.observe(this.sentinel.nativeElement);
  }

  /* ── Carga inicial de la tienda (nueva URL / nuevo slug) ── */
  private cargarTienda(slug: string): void {
    this.slugActual = slug;
    this.cargando.set(true);
    this.noEncontrada.set(false);
    this.categoriaActiva.set('Todo');
    this.busqueda.set('');
    this.orden.set('relevancia');
    this.page.set(1);
    this.productos.set([]);

    this.pedirPagina(1, true).subscribe({
      next: res => {
        this.tienda.set(res.shop);
        this.categorias.set(res.categories);
        this.productos.set(res.products);
        this.hasMore.set(res.pagination.has_more);
        this.storeCtx.set({
          slug: res.shop.slug,
          nombre: res.shop.name,
          verificada: res.shop.verified,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.tienda.set(null);
        this.storeCtx.clear();
        this.noEncontrada.set(true);
        this.cargando.set(false);
      },
    });
  }

  /** Cambió categoría, orden o búsqueda: se pide de nuevo desde la página 1 */
  private reiniciarYcargar(): void {
    this.page.set(1);
    this.productos.set([]);
    this.cargando.set(true);

    this.pedirPagina(1, false).subscribe({
      next: res => {
        this.productos.set(res.products);
        this.hasMore.set(res.pagination.has_more);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Scroll llegó al final: se pide la siguiente página y se concatena */
  private cargarSiguientePagina(): void {
    const siguiente = this.page() + 1;
    this.cargandoMas.set(true);

    this.pedirPagina(siguiente, false).subscribe({
      next: res => {
        this.productos.update(list => [...list, ...res.products]);
        this.hasMore.set(res.pagination.has_more);
        this.page.set(siguiente);
        this.cargandoMas.set(false);
      },
      error: () => this.cargandoMas.set(false),
    });
  }

  private pedirPagina(page: number, incluirTienda: boolean) {
    const query: CatalogQuery = {
      page,
      category: this.categoriaActiva(),
      q: this.busqueda() || undefined,
      sort: this.orden(),
    };
    return this.shopService.getCatalog(this.slugActual, query);
  }

  /* ── Acciones desde el template ── */
  cambiarCategoria(cat: string): void {
    this.categoriaActiva.set(cat);
    this.reiniciarYcargar();
  }

  cambiarBusqueda(texto: string): void {
    this.busquedaSubject.next(texto);
  }

  cambiarOrden(ev: Event): void {
    this.orden.set((ev.target as HTMLSelectElement).value as Orden);
    this.reiniciarYcargar();
  }

  toggleFavorito(id: number, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const set = new Set(this.favoritos());
    set.has(id) ? set.delete(id) : set.add(id);
    this.favoritos.set(set);
  }

  hayMas(): boolean {
    return this.hasMore();
  }

  /* ── Helpers de presentación ── */
  imagen(p: ApiProduct): string | null {
    return p.images?.length ? p.images[0].url : null;
  }

  badgeLabel(p: ApiProduct): string | null {
    if (p.previous_price) return 'Oferta';
    if (p.badge === 'best_seller') return 'Más vendido';
    if (p.badge === 'new') return 'Nuevo';
    return null;
  }

  cop(valor: string | number): string {
    return '$' + Number(valor).toLocaleString('es-CO');
  }

  rating(p: ApiProduct): number {
    return Number(p.rating_average) || 0;
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  compacto(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' mil' : String(n);
  }
}