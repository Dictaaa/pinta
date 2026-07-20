// src/app/core/services/api/orders.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';

export interface ApiOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  size_name: string | null;
  color_name: string | null;
  unit_price: string;
  quantity: number;
}

export interface ApiShopOrder {
  id: number;
  order_id: number;
  subtotal: string;
  shipping_cost: string;
  commission_amount: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'canceled';
  tracking_number: string | null;
  created_at: string;
  items: ApiOrderItem[];
  order: {
    id: number;
    order_number: string;
    created_at: string;
    buyer: { first_name: string; last_name: string; phone: string; email: string };
    shipping_address: {
      address_line: string;
      address_detail: string | null;
      receiver_name: string;
      receiver_phone: string;
      city: { name: string };
    };
  };
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private api = inject(ApiService);

  listMine(): Observable<ApiShopOrder[]> {
    return this.api.getAuth(ENDPOINTS.ORDERS.MINE) as Observable<ApiShopOrder[]>;
  }

  confirm(id: number) {
    return this.api.patchAuth(ENDPOINTS.ORDERS.CONFIRM(id), {});
  }

  reject(id: number) {
    return this.api.patchAuth(ENDPOINTS.ORDERS.REJECT(id), {});
  }

  ship(id: number, trackingNumber: string) {
    return this.api.patchAuth(ENDPOINTS.ORDERS.SHIP(id), { tracking_number: trackingNumber });
  }

  deliver(id: number) {
    return this.api.patchAuth(ENDPOINTS.ORDERS.DELIVER(id), {});
  }
}
