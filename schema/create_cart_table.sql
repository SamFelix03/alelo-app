-- Create cart table for storing buyer cart items
CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique product per buyer-seller combination
  UNIQUE(buyer_id, seller_id, product_id)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_id ON cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_seller_id ON cart_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer_seller ON cart_items(buyer_id, seller_id);

-- Create trigger for updating timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cart_items_updated_at ON cart_items;

CREATE TRIGGER trigger_update_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_cart_items_updated_at();

-- Add some sample data for testing
-- Note: These will fail if the referenced IDs don't exist, which is expected
INSERT INTO cart_items (buyer_id, seller_id, product_id, quantity, price_at_time, price_unit)
SELECT 
  b.buyer_id,
  s.seller_id,
  p.product_id,
  2.0,
  p.price,
  p.price_unit
FROM buyers b
CROSS JOIN sellers s
CROSS JOIN products p
WHERE b.phone_number LIKE '+1%'
  AND s.phone_number LIKE '+1%'
  AND p.name LIKE 'Tomato%'
LIMIT 3
ON CONFLICT (buyer_id, seller_id, product_id) DO NOTHING; 