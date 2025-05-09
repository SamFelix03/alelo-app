-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types for consistent data values
CREATE TYPE user_type AS ENUM ('seller', 'buyer');
CREATE TYPE product_type AS ENUM ('fruits', 'vegetables', 'prepared_food', 'beverages', 'crafts', 'other');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');

-- Base users table for authentication
CREATE TABLE users (
    phone_number VARCHAR(15) PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    user_type user_type NOT NULL,
    fcm_token VARCHAR(255) -- For Firebase Cloud Messaging notifications
);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modified
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Sellers table
CREATE TABLE sellers (
    seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL REFERENCES users(phone_number) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    current_location GEOGRAPHY(POINT, 4326), -- Using PostGIS geography type for lat/long coordinates
    logo_url TEXT,
    address TEXT,
    is_open BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    business_hours JSONB, -- Flexible storage for business hours
    UNIQUE(phone_number) -- Ensures one seller profile per phone number
);

CREATE TRIGGER update_sellers_modified
BEFORE UPDATE ON sellers
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add spatial index for efficient geolocation queries
CREATE INDEX sellers_location_idx ON sellers USING GIST (current_location);
-- Add index on is_open for filtering active sellers
CREATE INDEX sellers_is_open_idx ON sellers (is_open);

-- Buyers table
CREATE TABLE buyers (
    buyer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) NOT NULL REFERENCES users(phone_number) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    current_location GEOGRAPHY(POINT, 4326),
    profile_pic_url TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(phone_number) -- Ensures one buyer profile per phone number
);

CREATE TRIGGER update_buyers_modified
BEFORE UPDATE ON buyers
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add spatial index for buyer locations (for potential future features)
CREATE INDEX buyers_location_idx ON buyers USING GIST (current_location);

-- Products table
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10, 2) NOT NULL,
    price_unit VARCHAR(20) NOT NULL, -- e.g., "kg", "piece", "bunch"
    product_type product_type NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_products_modified
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add index for product searches by seller
CREATE INDEX products_seller_id_idx ON products(seller_id);
-- Add index for product type searches
CREATE INDEX products_type_idx ON products(product_type);
-- Add composite index for available products by seller
CREATE INDEX products_available_seller_idx ON products(seller_id, is_available);

-- Liked (favorites) table - many-to-many relationship
CREATE TABLE liked (
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (buyer_id, seller_id) -- Composite primary key prevents duplicate entries
);

-- Orders table
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_orders_modified
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add indexes for common order queries
CREATE INDEX orders_buyer_id_idx ON orders(buyer_id);
CREATE INDEX orders_seller_id_idx ON orders(seller_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);

-- Order items table (for multiple products per order)
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL, -- Decimal allows for fractional quantities (e.g., 0.5 kg)
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying items by order
CREATE INDEX order_items_order_id_idx ON order_items(order_id);

-- Location history table for sellers (useful for analytics and tracking patterns)
CREATE TABLE seller_location_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying location history by seller
CREATE INDEX location_history_seller_idx ON seller_location_history(seller_id);
-- Add time-based index for temporal queries
CREATE INDEX location_history_time_idx ON seller_location_history(timestamp);

-- Create RLS (Row Level Security) policies for data protection

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_location_history ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (these would need to be customized based on your auth model)

-- Users can only read/update their own data
CREATE POLICY users_policy ON users 
  USING (phone_number = auth.uid());

-- Sellers can only manage their own profile
CREATE POLICY sellers_policy ON sellers 
  USING (phone_number = auth.uid());

-- Buyers can only manage their own profile  
CREATE POLICY buyers_policy ON buyers 
  USING (phone_number = auth.uid());

-- All users can see products of active sellers
CREATE POLICY products_view_policy ON products 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sellers s 
      WHERE s.seller_id = products.seller_id 
      AND s.is_open = TRUE
    )
  );

-- Sellers can only manage their own products
CREATE POLICY products_manage_policy ON products 
  USING (
    EXISTS (
      SELECT 1 FROM sellers s 
      WHERE s.seller_id = products.seller_id 
      AND s.phone_number = auth.uid()
    )
  );

-- Create functions for nearby seller queries

-- Function to find sellers within a specified radius
CREATE OR REPLACE FUNCTION find_nearby_sellers(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  seller_id UUID,
  name VARCHAR(100),
  logo_url TEXT,
  distance_meters DOUBLE PRECISION,
  current_location GEOGRAPHY
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.seller_id,
    s.name,
    s.logo_url,
    ST_Distance(s.current_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_meters,
    s.current_location
  FROM 
    sellers s
  WHERE 
    s.is_open = TRUE
    AND ST_DWithin(
      s.current_location, 
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, 
      radius_meters
    )
  ORDER BY 
    distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update seller's current location
CREATE OR REPLACE FUNCTION update_seller_location(
  seller_uuid UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
DECLARE
  seller_phone VARCHAR;
BEGIN
  -- Get the seller's phone number for authorization check
  SELECT phone_number INTO seller_phone FROM sellers WHERE seller_id = seller_uuid;
  
  -- Check if the current user is authorized
  IF seller_phone != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- Update the location
  UPDATE sellers 
  SET current_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      updated_at = NOW()
  WHERE seller_id = seller_uuid;
  
  -- Record in history table
  INSERT INTO seller_location_history (seller_id, location)
  VALUES (seller_uuid, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order total calculation
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total_amount = (
    SELECT SUM(subtotal)
    FROM order_items
    WHERE order_id = NEW.order_id
  )
  WHERE order_id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION calculate_order_total();

-- Create views for common queries

-- View for seller dashboard with order counts
CREATE VIEW seller_dashboard AS
SELECT
  s.seller_id,
  s.name,
  s.is_open,
  COUNT(DISTINCT o.order_id) FILTER (WHERE o.status = 'pending') AS pending_orders,
  COUNT(DISTINCT o.order_id) FILTER (WHERE o.status = 'completed' AND o.created_at > NOW() - INTERVAL '24 hours') AS completed_orders_24h,
  COUNT(DISTINCT b.buyer_id) FILTER (WHERE l.seller_id IS NOT NULL) AS liked_by_count
FROM
  sellers s
LEFT JOIN orders o ON s.seller_id = o.seller_id
LEFT JOIN liked l ON s.seller_id = l.seller_id
LEFT JOIN buyers b ON l.buyer_id = b.buyer_id
GROUP BY
  s.seller_id, s.name, s.is_open;

-- View for buyer's favorite sellers with location
CREATE VIEW buyer_favorites AS
SELECT
  b.buyer_id,
  s.seller_id,
  s.name as seller_name,
  s.logo_url,
  s.is_open,
  s.current_location
FROM
  buyers b
JOIN liked l ON b.buyer_id = l.buyer_id
JOIN sellers s ON l.seller_id = s.seller_id;