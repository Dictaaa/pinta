// src/app/features/cart/pages/cart/cart.ts
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartItem, CartService } from '../../../../core/services/cart';

interface GrupoTienda {
  slug: string;
  nombre: string;
  items: CartItem[];
  subtotal: number;
  envio: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  cart = inject(CartService);
  private router = inject(Router);

  // TODO: el envío real vendrá del backend según ciudad/tienda.
  private readonly ENVIO_POR_TIENDA = 12000;

  /** Items agrupados por tienda — cada tienda despacha por separado */
  grupos = computed<GrupoTienda[]>(() => {
    const mapa = new Map<string, GrupoTienda>();

    for (const item of this.cart.items()) {
      let grupo = mapa.get(item.tiendaSlug);
      if (!grupo) {
        grupo = {
          slug: item.tiendaSlug,
          nombre: item.tiendaNombre,
          items: [],
          subtotal: 0,
          envio: this.ENVIO_POR_TIENDA,
        };
        mapa.set(item.tiendaSlug, grupo);
      }
      grupo.items.push(item);
      grupo.subtotal += item.precio * item.cantidad;
    }

    return [...mapa.values()];
  });

  totalEnvios = computed(() =>
    this.grupos().reduce((acc, g) => acc + g.envio, 0)
  );

  totalGeneral = computed(() => this.cart.total() + this.totalEnvios());

  /* ── Acciones ───────────────────────────────── */
  masCantidad(item: CartItem): void {
    this.cart.cambiarCantidad(item.productoId, item.cantidad + 1, item.variantId);
  }

  menosCantidad(item: CartItem): void {
    this.cart.cambiarCantidad(item.productoId, item.cantidad - 1, item.variantId);
  }

  quitar(item: CartItem): void {
    this.cart.quitar(item.productoId, item.variantId);
  }

  pagar(): void {
    this.router.navigate(['/checkout']);
  }

  /* ── Helpers ────────────────────────────────── */
  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }
}