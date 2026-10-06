// src/types/index.ts

export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Product = {
  id: string;
  shop_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type SaleItem = {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
};

export type Sale = {
  id?: string;
  shop_id: string;
  order_type: 'sur_place' | 'a_emporter' | 'livraison';
  payment_method: 'especes' | 'wave' | 'orange_money' | 'autre';
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  status: 'payee' | 'en_attente' | 'annulee';
  items: SaleItem[];
  created_at?: string;
};