// src/app/features/dashboard/pages/orders/orders.ts
import { Component, inject, signal } from '@angular/core';
import { ApiShopOrder, OrdersService } from '../../../../core/services/api/orders.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders {
  private ordersService = inject(OrdersService);

  pedidos = signal<ApiShopOrder[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  expandido = signal<number | null>(null);
  procesando = signal<number | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.ordersService.listMine().subscribe({
      next: res => {
        this.pedidos.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus pedidos.');
        this.cargando.set(false);
      },
    });
  }

  toggleExpandir(id: number): void {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  confirmar(p: ApiShopOrder): void {
    if (!confirm('¿Confirmas que ya recibiste el comprobante de pago?')) return;
    this.procesando.set(p.id);
    this.ordersService.confirm(p.id).subscribe({
      next: () => this.actualizarEstado(p.id, 'confirmed'),
      error: err => this.manejarError(err),
    });
  }

  rechazar(p: ApiShopOrder): void {
    if (!confirm('¿Rechazar este pedido? El stock reservado se restaurará.')) return;
    this.procesando.set(p.id);
    this.ordersService.reject(p.id).subscribe({
      next: () => this.actualizarEstado(p.id, 'canceled'),
      error: err => this.manejarError(err),
    });
  }

  enviar(p: ApiShopOrder): void {
    const tracking = prompt('Número de guía (opcional):') ?? '';
    this.procesando.set(p.id);
    this.ordersService.ship(p.id, tracking).subscribe({
      next: () => this.actualizarEstado(p.id, 'shipped'),
      error: err => this.manejarError(err),
    });
  }

  entregar(p: ApiShopOrder): void {
    if (!confirm('¿Marcar este pedido como entregado?')) return;
    this.procesando.set(p.id);
    this.ordersService.deliver(p.id).subscribe({
      next: () => this.actualizarEstado(p.id, 'delivered'),
      error: err => this.manejarError(err),
    });
  }

  private actualizarEstado(id: number, status: ApiShopOrder['status']): void {
    this.pedidos.update(list => list.map(p => (p.id === id ? { ...p, status } : p)));
    this.procesando.set(null);
  }

  private manejarError(err: any): void {
    this.procesando.set(null);
    alert(err.error?.error ?? 'No se pudo procesar la acción');
  }

  estadoLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente de pago',
      confirmed: 'Pago confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      canceled: 'Rechazado',
    };
    return labels[status] ?? status;
  }

  cop(valor: string | number): string {
    return '$' + Number(valor).toLocaleString('es-CO');
  }
}