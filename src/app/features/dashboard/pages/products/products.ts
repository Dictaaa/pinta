// src/app/features/dashboard/pages/products/products.ts
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  ApiProduct, PlanUsage, ProductService,
} from '../../../../core/services/product';
import { ProductFormModal,ProductFormData } from '../../modal/product-form-modal/product-form-modal';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private productService = inject(ProductService);
private dialog = inject(MatDialog);
  productos = signal<ApiProduct[]>([]);
  planUsage = signal<PlanUsage | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.productService.listMine().subscribe({
      next: res => {
        this.productos.set(res.products);
        this.planUsage.set(res.plan_usage);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus productos.');
        this.cargando.set(false);
      },
    });
  }

  toggle(p: ApiProduct): void {
    this.productService.toggleActive(p.id).subscribe({
      next: res => {
        this.productos.update(list =>
          list.map(x => (x.id === res.id ? { ...x, active: res.active } : x)),
        );
        this.actualizarUso(res.active ? 1 : -1);
      },
      error: err => {
        // Límite del plan al reactivar
        alert(err.error?.error ?? 'No se pudo cambiar el estado');
      },
    });
  }

  eliminar(p: ApiProduct): void {
    if (!confirm(`¿Eliminar "${p.name}"? Dejará de mostrarse en tu tienda.`)) return;

    this.productService.remove(p.id).subscribe({
      next: () => {
        const estabaActivo = p.active;
        this.productos.update(list => list.filter(x => x.id !== p.id));
        if (estabaActivo) this.actualizarUso(-1);
      },
      error: () => alert('No se pudo eliminar el producto'),
    });
  }

  private actualizarUso(delta: number): void {
    this.planUsage.update(u =>
      u ? { ...u, products_used: u.products_used + delta } : u,
    );
  }

  /* ── Helpers ── */
  imagen(p: ApiProduct): string | null {
    return p.ProductImages?.length ? p.ProductImages[0].url : null;
  }

  stockTotal(p: ApiProduct): number {
    return (p.ProductVariants ?? []).reduce((acc, v) => acc + v.stock, 0);
  }

  usoPct(): number {
    const u = this.planUsage();
    if (!u || !u.product_limit) return 0;
    return Math.min(100, Math.round((u.products_used / u.product_limit) * 100));
  }

  limiteAlcanzado(): boolean {
    const u = this.planUsage();
    return !!u && u.products_used >= u.product_limit;
  }

  cop(valor: string | number): string {
    return '$' + Number(valor).toLocaleString('es-CO');
  }

  openModal(producto: ApiProduct | null = null): void {
  const data: ProductFormData = {
    producto,
    maxImagenes: this.planUsage()?.images_per_product ?? 10,
  };

  this.dialog
    .open(ProductFormModal, {
      data,
      panelClass: 'dialog-panel',
      width: '860px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
    })
    .afterClosed()
    .subscribe(guardado => {
      if (guardado) this.cargar();   // recarga lista + barra del plan
    });
}

}