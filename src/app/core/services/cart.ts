// src/app/core/services/cart.ts
import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  productoId: number;
  variantId?: number;      // discrimina la línea (más confiable que el string de talla)
  nombre: string;
  precio: number;
  tiendaSlug: string;
  tiendaNombre: string;
  talla?: string;          // solo para mostrar
  cantidad: number;
  imagen?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly cantidad = computed(() =>
    this._items().reduce((acc, i) => acc + i.cantidad, 0)
  );
  readonly total = computed(() =>
    this._items().reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  );

  agregar(item: Omit<CartItem, 'cantidad'>, cantidad = 1): void {
    this._items.update(items => {
      const idx = items.findIndex(
        i => i.productoId === item.productoId && i.variantId === item.variantId
      );
      if (idx > -1) {
        const copia = [...items];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + cantidad };
        return copia;
      }
      return [...items, { ...item, cantidad }];
    });
  }

  quitar(productoId: number, variantId?: number): void {
    this._items.update(items =>
      items.filter(i => !(i.productoId === productoId && i.variantId === variantId))
    );
  }

  cambiarCantidad(productoId: number, cantidad: number, variantId?: number): void {
    if (cantidad < 1) return this.quitar(productoId, variantId);
    this._items.update(items =>
      items.map(i =>
        i.productoId === productoId && i.variantId === variantId ? { ...i, cantidad } : i
      )
    );
  }

  vaciar(): void {
    this._items.set([]);
  }
}