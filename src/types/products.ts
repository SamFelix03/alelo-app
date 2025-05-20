export type ProductType = 'fruits' | 'vegetables' | 'prepared_food' | 'beverages' | 'crafts' | 'other';
export type PriceUnit = 'kg' | 'g' | 'piece' | 'dozen' | 'liter' | 'ml' | 'bunch' | 'pack';

export interface ProductTemplate {
  template_id: string;
  name: string;
  image_url: string | null;
  suggested_price: number;
  price_unit: PriceUnit;
  product_type: ProductType;
  description: string | null;
}

export interface SellerProduct {
  seller_product_id: string;
  template_id: string | null;
  name: string;
  image_url: string | null;
  price: number;
  price_unit: PriceUnit;
  product_type: ProductType;
  description: string | null;
  is_available: boolean;
  is_active: boolean;
}

export interface DisplayProduct extends ProductTemplate {
  isSelected?: boolean;
  isInCatalog?: boolean;
  seller_product_id?: string;
  current_price?: number;
  is_available?: boolean;
} 