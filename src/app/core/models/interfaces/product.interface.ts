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
  price: string;              // NUMERIC llega como string
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
