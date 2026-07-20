// src/app/features/dashboard/pages/dashboard/dashboard.ts
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/api/auth.service';
import { DashboardService, DashboardSummary } from '../../../../core/services/api/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  auth = inject(AuthService);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  resumen = signal<DashboardSummary | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.dashboardService.getSummary().subscribe({
      next: res => {
        this.resumen.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tu panel.');
        this.cargando.set(false);
      },
    });
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  usoPct(): number {
    const r = this.resumen();
    if (!r?.plan || !r.plan.product_limit) return 0;
    return Math.min(100, Math.round((r.stats.products_active / r.plan.product_limit) * 100));
  }

  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }
}