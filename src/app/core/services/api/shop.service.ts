// src/app/core/services/api/shop.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';
import { ApiProduct } from '../product';

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

export interface CategoryCount {
  name: string;
  count: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface CatalogResponse {
  shop: PublicShop;
  categories: CategoryCount[];
  products: ApiProduct[];
  pagination: Pagination;
}

export interface ProductDetailResponse {
  shop: Pick<PublicShop, 'id' | 'slug' | 'name' | 'verified'>;
  product: ApiProduct;
}

export interface CatalogQuery {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
  sort?: 'relevancia' | 'ventas' | 'precio_asc' | 'precio_desc' | 'rating';
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private api = inject(ApiService);

  /**
   * Todo el filtrado/orden/paginado se resuelve en el backend.
   * Este método solo arma la query string.
   */
  getCatalog(slug: string, query: CatalogQuery = {}): Observable<CatalogResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.category && query.category !== 'Todo') params = params.set('category', query.category);
    if (query.q) params = params.set('q', query.q);
    if (query.sort) params = params.set('sort', query.sort);

    const url = `${ENDPOINTS.SHOPS.CATALOG(slug)}?${params.toString()}`;
    return this.api.get(url) as Observable<CatalogResponse>;
  }

  getProduct(slug: string, id: number | string): Observable<ProductDetailResponse> {
    return this.api.get(ENDPOINTS.SHOPS.PRODUCT(slug, id)) as Observable<ProductDetailResponse>;
  }
}