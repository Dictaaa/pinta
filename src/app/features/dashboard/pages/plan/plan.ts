// src/app/features/dashboard/pages/plan/plan.ts
import { Component, computed, inject, signal } from '@angular/core';
import {
  ApiPlan, ApiSubscription, SubscriptionService,
} from '../../../../core/services/api/subscription.service';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [],
  templateUrl: './plan.html',
  styleUrl: './plan.scss',
})
export class Plan {
  private subs = inject(SubscriptionService);

  planes = signal<ApiPlan[]>([]);
  actual = signal<ApiSubscription | null>(null);
  historial = signal<ApiSubscription[]>([]);

  cargando = signal(true);
  cambiando = signal<number | null>(null);   // id del plan en proceso
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  usoPct = computed(() => {
    const s = this.actual();
    if (!s || !s.plan.product_limit) return 0;
    return Math.min(100, Math.round(((s.products_used ?? 0) / s.plan.product_limit) * 100));
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    Promise.all([
      this.subs.listPlans().toPromise(),
      this.subs.getMine().toPromise(),
    ]).then(([planes, mine]) => {
      this.planes.set(planes ?? []);
      this.actual.set(mine?.current ?? null);
      this.historial.set(mine?.history ?? []);
      this.cargando.set(false);
    }).catch(() => {
      this.error.set('No pudimos cargar tu suscripción.');
      this.cargando.set(false);
    });
  }

  esActual(plan: ApiPlan): boolean {
    return this.actual()?.plan_id === plan.id;
  }

  esDowngrade(plan: ApiPlan): boolean {
    const actual = this.actual()?.plan;
    return !!actual && plan.product_limit < actual.product_limit;
  }

  cambiar(plan: ApiPlan): void {
    if (this.esActual(plan)) return;

    const accion = this.esDowngrade(plan) ? 'bajar a' : 'cambiar a';
    if (!confirm(`¿Seguro que quieres ${accion} el plan ${plan.name}?`)) return;

    this.error.set(null);
    this.exito.set(null);
    this.cambiando.set(plan.id);

    this.subs.changePlan(plan.id).subscribe({
      next: () => {
        this.exito.set(`Ahora estás en el plan ${plan.name}.`);
        this.cambiando.set(null);
        this.cargar();
      },
      error: err => {
        this.cambiando.set(null);
        this.error.set(err.error?.error ?? 'No se pudo cambiar el plan');
      },
    });
  }

  cop(valor: string | number): string {
    const n = Number(valor);
    return n === 0 ? 'Gratis' : '$' + n.toLocaleString('es-CO') + '/mes';
  }

  fecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
}