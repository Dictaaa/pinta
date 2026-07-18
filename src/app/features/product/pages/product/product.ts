// src/app/features/product/pages/product/product.ts
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart';
import { StoreContextService } from '../../../../core/services/store-context';
import { ShopService } from '../../../../core/services/api/shop.service';
import { ApiProduct } from '../../../../core/services/product';

interface TiendaLigera {
  id: number;
  slug: string;
  name: string;
  verified: boolean;
}

interface TallaDisponible {
  size_id: number | null;
  name: string;
  stock: number;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private storeCtx = inject(StoreContextService);
  private cart = inject(CartService);
  private shopService = inject(ShopService);

  /* ── Estado ─────────────────────────────────── */
  producto = signal<ApiProduct | null>(null);
  tienda = signal<TiendaLigera | null>(null);
  relacionados = signal<ApiProduct[]>([]);
  cargando = signal(true);
  noEncontrado = signal(false);

  imagenActiva = signal(0);
  tallaSeleccionada = signal<TallaDisponible | null>(null);
  faltaTalla = signal(false);
  cantidad = signal(1);
  agregado = signal(false);
  favorito = signal(false);

  /* ── Derivados ──────────────────────────────── */
  imagenes = computed(() => this.producto()?.images ?? []);

  /** Tallas reales del producto (de sus variantes) */
  tallas = computed<TallaDisponible[]>(() =>
    (this.producto()?.variants ?? []).map(v => ({
      size_id: v.size_id,
      name: v.size?.name ?? 'Única',
      stock: v.stock,
    })),
  );

  descuento = computed(() => {
    const p = this.producto();
    if (!p?.previous_price) return 0;
    return Math.round((1 - Number(p.price) / Number(p.previous_price)) * 100);
  });

  constructor() {
    // slug (del padre, via paramsInheritanceStrategy) + id
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params =>
        this.cargar(params.get('slug') ?? '', Number(params.get('id'))),
      );

    this.destroyRef.onDestroy(() => this.storeCtx.clear());
  }

  private cargar(slug: string, id: number): void {
    this.cargando.set(true);
    this.noEncontrado.set(false);
    this.imagenActiva.set(0);
    this.tallaSeleccionada.set(null);
    this.faltaTalla.set(false);
    this.cantidad.set(1);
    this.agregado.set(false);
    window.scrollTo({ top: 0 });

    this.shopService.getProduct(slug, id).subscribe({
      next: res => {
        this.producto.set(res.product);
        this.tienda.set(res.shop);
        this.storeCtx.set({
          slug: res.shop.slug,
          nombre: res.shop.name,
          verificada: res.shop.verified,
        });
        this.cargando.set(false);
        this.cargarRelacionados(slug, id);
      },
      error: () => {
        this.producto.set(null);
        this.storeCtx.clear();
        this.noEncontrado.set(true);
        this.cargando.set(false);
      },
    });
  }

  private cargarRelacionados(slug: string, id: number): void {
    this.shopService.getCatalog(slug).subscribe({
      next: res =>
        this.relacionados.set(res.products.filter(p => p.id !== id).slice(0, 4)),
      error: () => this.relacionados.set([]),
    });
  }

  /* ── Acciones ───────────────────────────────── */
  seleccionarTalla(t: TallaDisponible): void {
    if (t.stock === 0) return;
    this.tallaSeleccionada.set(t);
    this.faltaTalla.set(false);
  }

  cambiarCantidad(delta: number): void {
    const max = this.tallaSeleccionada()?.stock ?? 10;
    this.cantidad.update(c => Math.min(Math.min(10, max), Math.max(1, c + delta)));
  }

  agregarAlCarrito(): void {
    const p = this.producto();
    const t = this.tienda();
    if (!p || !t) return;

    const talla = this.tallaSeleccionada();
    if (!talla && this.tallas().length > 0) {
      this.faltaTalla.set(true);
      return;
    }

    this.cart.agregar(
      {
        productoId: p.id,
        nombre: p.name,
        precio: Number(p.price),
        tiendaSlug: t.slug,
        tiendaNombre: t.name,
        talla: talla?.name,
        imagen: p.images?.[0]?.url,
      },
      this.cantidad(),
    );

    this.agregado.set(true);
    setTimeout(() => this.agregado.set(false), 2000);
  }

  toggleFavorito(): void {
    this.favorito.update(v => !v);
  }

  /* ── Helpers ────────────────────────────────── */
  cop(valor: string | number): string {
    return '$' + Number(valor).toLocaleString('es-CO');
  }

  rating(p: ApiProduct): number {
    return Number(p.rating_average) || 0;
  }

  badge(p: ApiProduct): string | null {
    if (p.previous_price) return 'Oferta';
    if (p.badge === 'best_seller') return 'Más vendido';
    if (p.badge === 'new') return 'Nuevo';
    return null;
  }

  imagenDe(p: ApiProduct): string | null {
    return p.images?.length ? p.images[0].url : null;
  }
}