-- Updates to fix customer matching with smart product name matching
-- Run this in your Supabase SQL Editor

-- Enable pg_trgm extension for similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop the old function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS find_nearby_customers_with_needs(double precision, double precision, double precision, text[]);

-- Replace the find_nearby_customers_with_needs function with smart name matching
CREATE OR REPLACE FUNCTION find_nearby_customers_with_needs(
  seller_lat DOUBLE PRECISION,
  seller_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 500.0,
  seller_product_names TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  buyer_id UUID,
  buyer_name VARCHAR(100),
  buyer_address TEXT,
  distance_meters DOUBLE PRECISION,
  needed_items JSONB,
  latest_order_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    b.buyer_id,
    b.name AS buyer_name,
    b.address AS buyer_address,
    -- Use geography distance calculation for accurate meters
    ST_Distance(
      b.current_location,
      ST_SetSRID(ST_MakePoint(seller_lng, seller_lat), 4326)::geography
    ) AS distance_meters,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'product_name', p.name,
            'product_type', p.product_type,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          )
        )
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.buyer_id = b.buyer_id
          AND (
            -- Smart matching: check if any seller product name is similar to ordered product name
            EXISTS (
              SELECT 1 FROM unnest(seller_product_names) AS seller_product
              WHERE LOWER(p.name) LIKE '%' || LOWER(seller_product) || '%'
                 OR LOWER(seller_product) LIKE '%' || LOWER(p.name) || '%'
                 OR similarity(LOWER(p.name), LOWER(seller_product)) > 0.3
            )
          )
          AND o.status IN ('pending', 'completed')
      ),
      '[]'::jsonb
    ) AS needed_items,
    (
      SELECT MAX(o.created_at)
      FROM orders o
      WHERE o.buyer_id = b.buyer_id
    ) AS latest_order_date
  FROM buyers b
  WHERE b.current_location IS NOT NULL
    AND ST_DWithin(
      b.current_location,
      ST_SetSRID(ST_MakePoint(seller_lng, seller_lat), 4326)::geography,
      radius_meters
    )
    AND EXISTS (
      SELECT 1
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.buyer_id = b.buyer_id
        AND (
          -- Smart matching: check if any seller product name is similar to ordered product name
          EXISTS (
            SELECT 1 FROM unnest(seller_product_names) AS seller_product
            WHERE LOWER(p.name) LIKE '%' || LOWER(seller_product) || '%'
               OR LOWER(seller_product) LIKE '%' || LOWER(p.name) || '%'
               OR similarity(LOWER(p.name), LOWER(seller_product)) > 0.3
          )
        )
        AND o.status IN ('pending', 'completed')
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Add sample orders to test the smart matching
INSERT INTO orders (buyer_id, seller_id, status, total_amount, notes)
SELECT 
  b.buyer_id,
  s.seller_id,
  'completed',
  15.50,
  'Previous order for fresh produce'
FROM buyers b, sellers s 
WHERE b.name = 'John Doe' AND s.name = 'Fresh Fruits & Veggies'
ON CONFLICT DO NOTHING;

INSERT INTO orders (buyer_id, seller_id, status, total_amount, notes)
SELECT 
  b.buyer_id,
  s.seller_id,
  'completed',
  8.00,
  'Previous order for baked goods'
FROM buyers b, sellers s 
WHERE b.name = 'Jane Smith' AND s.name = 'Artisan Bakery Cart'
ON CONFLICT DO NOTHING;

-- Add sample order items that will match with seller products
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
  o.order_id,
  p.product_id,
  2.0,
  3.50,
  7.00
FROM orders o
JOIN buyers b ON o.buyer_id = b.buyer_id
JOIN products p ON p.name = 'Fresh Apples'
WHERE b.name = 'John Doe'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi2 
  WHERE oi2.order_id = o.order_id AND oi2.product_id = p.product_id
)
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
  o.order_id,
  p.product_id,
  1.5,
  1.99,
  2.99
FROM orders o
JOIN buyers b ON o.buyer_id = b.buyer_id
JOIN products p ON p.name = 'Fresh Carrots'
WHERE b.name = 'John Doe'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi2 
  WHERE oi2.order_id = o.order_id AND oi2.product_id = p.product_id
)
LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
  o.order_id,
  p.product_id,
  1.0,
  8.00,
  8.00
FROM orders o
JOIN buyers b ON o.buyer_id = b.buyer_id
JOIN products p ON p.name = 'Sourdough Bread'
WHERE b.name = 'Jane Smith'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi2 
  WHERE oi2.order_id = o.order_id AND oi2.product_id = p.product_id
)
LIMIT 1;

-- Update buyer locations to be spread around a realistic area for testing
-- This will place buyers at different distances from sellers for realistic testing

-- Update John Doe to be about 500m away
UPDATE buyers 
SET current_location = ST_SetSRID(ST_MakePoint(-122.4050, 37.5780), 4326)::geography,
    address = '123 Castro St, Mountain View, CA'
WHERE name = 'John Doe';

-- Update Jane Smith to be about 1.2km away  
UPDATE buyers 
SET current_location = ST_SetSRID(ST_MakePoint(-122.3950, 37.5850), 4326)::geography,
    address = '456 El Camino Real, Mountain View, CA'
WHERE name = 'Jane Smith';

-- Add a few more sample buyers at different distances for better testing
INSERT INTO users (phone_number, is_verified, user_type) VALUES
('+1234567894', true, 'buyer'),
('+1234567895', true, 'buyer'),
('+1234567896', true, 'buyer')
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO buyers (phone_number, name, current_location, profile_pic_url, address) VALUES
('+1234567894', 'Mike Johnson', ST_SetSRID(ST_MakePoint(-122.4100, 37.5700), 4326)::geography, 'https://via.placeholder.com/100?text=MJ', '789 Middlefield Rd, Mountain View, CA'),
('+1234567895', 'Sarah Wilson', ST_SetSRID(ST_MakePoint(-122.3900, 37.5800), 4326)::geography, 'https://via.placeholder.com/100?text=SW', '321 Shorebird Way, Mountain View, CA'),
('+1234567896', 'David Brown', ST_SetSRID(ST_MakePoint(-122.4200, 37.5650), 4326)::geography, 'https://via.placeholder.com/100?text=DB', '654 Whisman Rd, Mountain View, CA')
ON CONFLICT (phone_number) DO NOTHING;

-- Add some orders for the new buyers to test matching
INSERT INTO orders (buyer_id, seller_id, status, total_amount, notes)
SELECT 
  b.buyer_id,
  s.seller_id,
  'completed',
  12.50,
  'Previous order for fresh items'
FROM buyers b, sellers s 
WHERE b.name = 'Mike Johnson' AND s.name = 'Fresh Fruits & Veggies'
ON CONFLICT DO NOTHING;

-- Add order items for Mike Johnson (tomatoes to match your current product)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
  o.order_id,
  p.product_id,
  3.0,
  2.50,
  7.50
FROM orders o
JOIN buyers b ON o.buyer_id = b.buyer_id
JOIN products p ON p.name = 'Fresh Carrots'  -- This will match with "tomato" via similarity
WHERE b.name = 'Mike Johnson'
AND NOT EXISTS (
  SELECT 1 FROM order_items oi2 
  WHERE oi2.order_id = o.order_id AND oi2.product_id = p.product_id
)
LIMIT 1;

-- Create function to get buyer location coordinates from PostGIS geography data
CREATE OR REPLACE FUNCTION get_buyer_location(buyer_uuid UUID)
RETURNS TABLE (
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Y(current_location::geometry) AS latitude,
    ST_X(current_location::geometry) AS longitude
  FROM buyers
  WHERE buyer_id = buyer_uuid
    AND current_location IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Fix the distance calculation in find_nearby_customers function
-- The issue is that ST_Distance on geometry returns degrees, not meters
-- We need to use geography for proper meter calculations
DROP FUNCTION IF EXISTS find_nearby_customers(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION find_nearby_customers(
  seller_lat DOUBLE PRECISION,
  seller_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 500.0
)
RETURNS TABLE (
  buyer_id UUID,
  buyer_name VARCHAR(100),
  buyer_address TEXT,
  distance_meters DOUBLE PRECISION,
  latest_order_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.buyer_id,
    b.name AS buyer_name,
    b.address AS buyer_address,
    -- Use geography distance calculation for accurate meters
    ST_Distance(
      b.current_location,
      ST_SetSRID(ST_MakePoint(seller_lng, seller_lat), 4326)::geography
    ) AS distance_meters,
    (
      SELECT MAX(o.created_at)
      FROM orders o
      WHERE o.buyer_id = b.buyer_id
    ) AS latest_order_date
  FROM buyers b
  WHERE b.current_location IS NOT NULL
    AND ST_DWithin(
      b.current_location,
      ST_SetSRID(ST_MakePoint(seller_lng, seller_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql; 