// src/app/core/services/api/checkout.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';

export interface CheckoutPayload {
  buyer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  shipping: {
    city_id: number;
    address_line: string;
    address_detail?: string;
    receiver_name: string;
    receiver_phone: string;
  };
  items: {
    product_id: number;
    variant_id: number | null;
    quantity: number;
  }[];
}

export interface CheckoutResponse {
  order_number: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  shops: { shop_id: number; name: string; whatsapp: string | null; subtotal: number }[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private api = inject(ApiService);

  submit(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.api.post(ENDPOINTS.CHECKOUT.SUBMIT, payload) as Observable<CheckoutResponse>;
  }
}