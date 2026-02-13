-- Create table for tracking which sellers each buyer has liked
CREATE TABLE IF NOT EXISTS buyer_liked_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each buyer can only like a seller once
  UNIQUE(buyer_id, seller_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_buyer_liked_sellers_buyer_id ON buyer_liked_sellers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_liked_sellers_seller_id ON buyer_liked_sellers(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_liked_sellers_created_at ON buyer_liked_sellers(created_at DESC);

-- Add trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_buyer_liked_sellers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_update_buyer_liked_sellers_updated_at ON buyer_liked_sellers;

CREATE TRIGGER trigger_update_buyer_liked_sellers_updated_at
  BEFORE UPDATE ON buyer_liked_sellers
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_liked_sellers_updated_at();

-- Add some sample data for testing (optional)
-- This will add a few liked sellers for existing buyers
INSERT INTO buyer_liked_sellers (buyer_id, seller_id) 
SELECT 
  b.buyer_id,
  s.seller_id
FROM buyers b
CROSS JOIN sellers s
WHERE b.name = 'John Doe' 
  AND s.name IN ('Fresh Fruits & Veggies', 'Artisan Bakery Cart')
ON CONFLICT (buyer_id, seller_id) DO NOTHING;

INSERT INTO buyer_liked_sellers (buyer_id, seller_id) 
SELECT 
  b.buyer_id,
  s.seller_id
FROM buyers b
CROSS JOIN sellers s
WHERE b.name = 'Jane Smith' 
  AND s.name = 'Fresh Fruits & Veggies'
ON CONFLICT (buyer_id, seller_id) DO NOTHING; 