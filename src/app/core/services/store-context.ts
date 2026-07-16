import { Injectable, signal } from '@angular/core';
import { StoreProfile } from '../../features/store/pages/store/store';

/**
 * Contexto de tienda activa.
 * El componente Store lo setea al cargar y lo limpia al salir;
 * el Layout (header) lo lee para cambiar de modo marketplace → tienda.
 */
@Injectable({ providedIn: 'root' })
export class StoreContextService {
  readonly tiendaActual = signal<StoreProfile | null>(null);

  set(tienda: StoreProfile): void {
    this.tiendaActual.set(tienda);
  }

  clear(): void {
    this.tiendaActual.set(null);
  }
}