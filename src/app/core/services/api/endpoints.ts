// src/app/core/services/api/endpoints.ts
export const ENDPOINTS = {

  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    SLUG_AVAILABLE: (slug: string) => `/api/v1/auth/slug-disponible/${slug}`,
    CITIES: '/api/v1/auth/cities',
  },

  PRODUCTS: {
    GET_ALL: '/api/v1/products',
    GET_BY_ID: (id: number | string) => `/api/v1/products/${id}`,
    CATALOGS: '/api/v1/products/catalogs',

    // ── Tiendero (requieren token con shop_id) ──
    MINE: '/api/v1/products/mine',
    CREATE: '/api/v1/products',
    UPDATE: (id: number | string) => `/api/v1/products/${id}`,
    TOGGLE_ACTIVE: (id: number | string) => `/api/v1/products/${id}/active`,
    DELETE: (id: number | string) => `/api/v1/products/${id}`,
    ADD_IMAGES: (id: number | string) => `/api/v1/products/${id}/images`,
    REMOVE_IMAGE: (id: number | string, imageId: number | string) =>
      `/api/v1/products/${id}/images/${imageId}`,
  },

  SHOPS: {
    CATALOG: (slug: string) => `/api/v1/shops/${slug}/catalog`,
    PRODUCT: (slug: string, id: number | string) =>
      `/api/v1/shops/${slug}/products/${id}`,
  },
};