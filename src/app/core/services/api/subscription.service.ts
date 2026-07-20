// src/app/core/services/api/subscription.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';

export interface ApiPlan {
  id: number;
  name: string;
  description: string | null;
  monthly_price: string;
  product_limit: number;
  images_per_product: number;
  commission_percentage: string;
  featured_products_limit: number;
  position: number;
}

export interface ApiSubscription {
  id: number;
  shop_id: number;
  plan_id: number;
  starts_at: string;
  ends_at: string | null;
  status: 'active' | 'expired' | 'canceled';
  price_paid: string;
  created_at: string;
  plan: ApiPlan;
  products_used?: number;
}

export interface MineSubscription {
  current: ApiSubscription | null;
  history: ApiSubscription[];
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private api = inject(ApiService);

  listPlans(): Observable<ApiPlan[]> {
    return this.api.getAuth(ENDPOINTS.SUBSCRIPTIONS.PLANS) as Observable<ApiPlan[]>;
  }

  getMine(): Observable<MineSubscription> {
    return this.api.getAuth(ENDPOINTS.SUBSCRIPTIONS.MINE) as Observable<MineSubscription>;
  }

  changePlan(planId: number): Observable<ApiSubscription> {
    return this.api.postAuth(ENDPOINTS.SUBSCRIPTIONS.CHANGE, { plan_id: planId }) as
      Observable<ApiSubscription>;
  }
}
