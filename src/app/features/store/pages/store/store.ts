// src/app/features/store/pages/store/store.ts
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShopService, PublicShop } from '../../../../core/services/api/shop.service';
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
export class Store {
  private route = inject(ActivatedRoute);
  private shopService = inject(ShopService);
  private storeCtx = inject(StoreContextService);
  private destroyRef = inject(DestroyRef);

  /* ── Estado ─────────────────────────────────── */
  tienda = signal<PublicShop | null>(null);
  productos = signal<ApiProduct[]>([]);
  cargando = signal(true);
  noEncontrada = signal(false);

  categoriaActiva = signal<string>('Todo');
  orden = signal<Orden>('relevancia');
  favoritos = signal<Set<number>>(new Set());

  /* ── Derivados ──────────────────────────────── */
  categorias = computed(() => {
    const unicas = [...new Set(
      this.productos()
        .map(p => p.category?.name)
        .filter((n): n is string => !!n),
    )];
    return ['Todo', ...unicas];
  });

  productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    let lista = this.productos()
      .filter(p => cat === 'Todo' || p.category?.name === cat);

    switch (this.orden()) {
      case 'ventas':
        lista = [...lista].sort((a, b) => b.sold_count - a.sold_count); break;
      case 'precio_asc':
        lista = [...lista].sort((a, b) => Number(a.price) - Number(b.price)); break;
      case 'precio_desc':
        lista = [...lista].sort((a, b) => Number(b.price) - Number(a.price)); break;
      case 'rating':
        lista = [...lista].sort((a, b) => Number(b.rating_average) - Number(a.rating_average)); break;
    }
    return lista;
  });

  constructor() {
    // El componente se REUTILIZA al navegar entre slugs
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.cargar(params.get('slug') ?? ''));

    this.destroyRef.onDestroy(() => this.storeCtx.clear());
  }

  private cargar(slug: string): void {
    this.cargando.set(true);
    this.noEncontrada.set(false);
    this.categoriaActiva.set('Todo');

    this.shopService.getCatalog(slug).subscribe({
      next: res => {
        this.tienda.set(res.shop);
        this.productos.set(res.products);
        this.storeCtx.set({
          slug: res.shop.slug,
          nombre: res.shop.name,
          verificada: res.shop.verified,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.tienda.set(null);
        this.productos.set([]);
        this.storeCtx.clear();
        this.noEncontrada.set(true);
        this.cargando.set(false);
      },
    });
  }

  /* ── Acciones ───────────────────────────────── */
  toggleFavorito(id: number, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const set = new Set(this.favoritos());
    set.has(id) ? set.delete(id) : set.add(id);
    this.favoritos.set(set);
  }

  cambiarOrden(ev: Event): void {
    this.orden.set((ev.target as HTMLSelectElement).value as Orden);
  }

  /* ── Helpers de presentación ────────────────── */
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
    return nombre
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  compacto(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' mil' : String(n);
  }
}