import { Injectable, signal } from '@angular/core';

export interface StoreContext {
  slug: string;
  nombre: string;
  verificada: boolean;
}

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  readonly tiendaActual = signal<StoreContext | null>(null);

  set(tienda: StoreContext): void {
    this.tiendaActual.set(tienda);
  }

  clear(): void {
    this.tiendaActual.set(null);
  }
}