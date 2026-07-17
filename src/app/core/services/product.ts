// src/app/core/services/product.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api/api.service';
import { ENDPOINTS } from './api/endpoints';

/* ── Tipos de la API ── */
export interface ApiImage {
  id: number;
  url: string;
  position: number;
}

export interface ApiVariant {
  id: number;
  size_id: number | null;
  color_id: number | null;
  stock: number;
  Size?: { id: number; name: string };
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string | null;
  price: string;              // NUMERIC de Postgres llega como string
  previous_price: string | null;
  gender: string;
  condition: string;
  sold_count: number;
  rating_average: string;
  active: boolean;
  category_id: number;
  brand_id: number | null;
  Category?: { id: number; name: string };
  ProductImages?: ApiImage[];
  ProductVariants?: ApiVariant[];
  category?: { id: number; name: string };
  images?: ApiImage[];
  variants?: ApiVariant[];
}

export interface PlanUsage {
  plan_name: string;
  products_used: number;
  product_limit: number;
  images_per_product: number;
}

export interface MineResponse {
  products: ApiProduct[];
  plan_usage: PlanUsage;
}

export interface Catalogs {
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  sizes: { id: number; name: string }[];
  colors: { id: number; name: string; hex_code: string }[];
}

export interface VariantInput {
  size_id: number | null;
  color_id?: number | null;
  stock: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  previous_price: number | null;
  category_id: number;
  brand_id: number | null;
  gender: string;
  condition: string;
  variants: VariantInput[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ApiService);

  getCatalogs(): Observable<Catalogs> {
    return this.api.getAuth(ENDPOINTS.PRODUCTS.CATALOGS) as Observable<Catalogs>;
  }

  listMine(): Observable<MineResponse> {
    return this.api.getAuth(ENDPOINTS.PRODUCTS.MINE) as Observable<MineResponse>;
  }

  /** Crear: campos + variantes como JSON string + fotos (FormData) */
  create(data: ProductInput, images: File[]): Observable<ApiProduct> {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('description', data.description ?? '');
    fd.append('price', String(data.price));
    if (data.previous_price) fd.append('previous_price', String(data.previous_price));
    fd.append('category_id', String(data.category_id));
    if (data.brand_id) fd.append('brand_id', String(data.brand_id));
    fd.append('gender', data.gender);
    fd.append('condition', data.condition);
    fd.append('variants', JSON.stringify(data.variants));
    images.forEach(img => fd.append('images', img));

    return this.api.postAuth(ENDPOINTS.PRODUCTS.CREATE, fd) as Observable<ApiProduct>;
  }

  update(id: number, data: ProductInput): Observable<ApiProduct> {
    return this.api.putAuth(ENDPOINTS.PRODUCTS.UPDATE(id), {
      ...data,
      variants: JSON.stringify(data.variants),
    }) as Observable<ApiProduct>;
  }

  toggleActive(id: number): Observable<{ id: number; active: boolean }> {
    return this.api.patchAuth(ENDPOINTS.PRODUCTS.TOGGLE_ACTIVE(id), {}) as
      Observable<{ id: number; active: boolean }>;
  }

  remove(id: number): Observable<{ message: string }> {
    return this.api.deleteAuth(ENDPOINTS.PRODUCTS.DELETE(id)) as
      Observable<{ message: string }>;
  }

  addImages(id: number, images: File[]): Observable<ApiImage[]> {
    const fd = new FormData();
    images.forEach(img => fd.append('images', img));
    return this.api.postAuth(ENDPOINTS.PRODUCTS.ADD_IMAGES(id), fd) as
      Observable<ApiImage[]>;
  }

  removeImage(productId: number, imageId: number): Observable<{ message: string }> {
    return this.api.deleteAuth(ENDPOINTS.PRODUCTS.REMOVE_IMAGE(productId, imageId)) as
      Observable<{ message: string }>;
  }
}