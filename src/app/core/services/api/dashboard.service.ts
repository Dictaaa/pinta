// src/app/core/services/api/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';

export interface DashboardSummary {
  shop: { id: number; slug: string; name: string };
  plan: { name: string; product_limit: number } | null;
  stats: {
    products_active: number;
    products_total: number;
    total_sold: number;
  };
  recent_orders: any[];
  orders_module_ready: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  getSummary(): Observable<DashboardSummary> {
    return this.api.getAuth(ENDPOINTS.DASHBOARD.SUMMARY) as Observable<DashboardSummary>;
  }
}
