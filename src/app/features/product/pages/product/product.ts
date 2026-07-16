import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart';
import { StoreContextService } from '../../../../core/services/store-context';
import {
  MOCK_TIENDAS,
  StoreProduct,
  StoreProfile,
} from '../../../store/pages/store/store';

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

  /* ── Estado ─────────────────────────────────── */
  producto = signal<StoreProduct | null>(null);
  tienda = signal<StoreProfile | null>(null);
  relacionados = signal<StoreProduct[]>([]);
  cargando = signal(true);
  noEncontrado = signal(false);

  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  tallaSeleccionada = signal<string | null>(null);
  faltaTalla = signal(false);
  cantidad = signal(1);
  agregado = signal(false);
  favorito = signal(false);

  descuento = computed(() => {
    const p = this.producto();
    if (!p?.anterior) return 0;
    return Math.round((1 - p.precio / p.anterior) * 100);
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.cargarProducto(Number(params.get('id'))));

    this.destroyRef.onDestroy(() => this.storeCtx.clear());
  }

  /* ── Carga (mock — reemplazar por ProductService) ─ */
  private cargarProducto(id: number): void {
    this.cargando.set(true);
    this.noEncontrado.set(false);
    this.tallaSeleccionada.set(null);
    this.faltaTalla.set(false);
    this.cantidad.set(1);
    this.agregado.set(false);
    window.scrollTo({ top: 0 });

    // TODO: this.productService.getById(id) cuando exista el API
    for (const data of Object.values(MOCK_TIENDAS)) {
      const encontrado = data.productos.find(p => p.id === id);
      if (encontrado) {
        this.producto.set(encontrado);
        this.tienda.set(data.perfil);
        this.relacionados.set(
          data.productos.filter(p => p.id !== id).slice(0, 4)
        );
        this.storeCtx.set(data.perfil);
        this.cargando.set(false);
        return;
      }
    }

    this.producto.set(null);
    this.noEncontrado.set(true);
    this.cargando.set(false);
  }

  /* ── Acciones ───────────────────────────────── */
  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada.set(talla);
    this.faltaTalla.set(false);
  }

  cambiarCantidad(delta: number): void {
    this.cantidad.update(c => Math.min(10, Math.max(1, c + delta)));
  }

  agregarAlCarrito(): void {
    const p = this.producto();
    const t = this.tienda();
    if (!p || !t) return;

    if (!this.tallaSeleccionada()) {
      this.faltaTalla.set(true);
      return;
    }

    this.cart.agregar(
      {
        productoId: p.id,
        nombre: p.nombre,
        precio: p.precio,
        tiendaSlug: t.slug,
        tiendaNombre: t.nombre,
        talla: this.tallaSeleccionada()!,
        imagen: p.imagen,
      },
      this.cantidad()
    );

    // Feedback en el botón
    this.agregado.set(true);
    setTimeout(() => this.agregado.set(false), 2000);
  }

  toggleFavorito(): void {
    this.favorito.update(v => !v);
  }

  /* ── Helpers ────────────────────────────────── */
  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }
}