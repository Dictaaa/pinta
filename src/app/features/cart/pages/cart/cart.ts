import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  // TODO: el envío real vendrá del backend según ciudad/tienda.
  // Mock: tarifa plana por tienda.
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
    this.cart.cambiarCantidad(item.productoId, item.cantidad + 1, item.talla);
  }

  menosCantidad(item: CartItem): void {
    this.cart.cambiarCantidad(item.productoId, item.cantidad - 1, item.talla);
  }

  quitar(item: CartItem): void {
    this.cart.quitar(item.productoId, item.talla);
  }

  pagar(): void {
    // TODO: navegación a checkout cuando exista
    console.log('Checkout →', this.cart.items());
  }

  /* ── Helpers ────────────────────────────────── */
  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }
}