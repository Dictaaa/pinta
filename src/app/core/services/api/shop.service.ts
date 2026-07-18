// src/app/core/services/api/shop.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';
import { ApiProduct } from '../product';   // ajusta la ruta si tu product.ts vive en otro lado

export interface PublicShop {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  verified: boolean;
  instagram: string | null;
  whatsapp: string | null;
  city: string | null;
  products_count: number;
  total_sold: number;
}

export interface CatalogResponse {
  shop: PublicShop;
  products: ApiProduct[];
}

export interface ProductDetailResponse {
  shop: Pick<PublicShop, 'id' | 'slug' | 'name' | 'verified'>;
  product: ApiProduct;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private api = inject(ApiService);

  getCatalog(slug: string): Observable<CatalogResponse> {
    return this.api.get(ENDPOINTS.SHOPS.CATALOG(slug)) as Observable<CatalogResponse>;
  }

  getProduct(slug: string, id: number | string): Observable<ProductDetailResponse> {
    return this.api.get(ENDPOINTS.SHOPS.PRODUCT(slug, id)) as Observable<ProductDetailResponse>;
  }
}