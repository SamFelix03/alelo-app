-- Simplified Alelo App Database Schema with Real-time Location Tracking
-- Run this entire script in your Supabase SQL Editor
-- This version has RLS disabled for easier development and testing

-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS seller_location_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS liked CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS seller_products CASCADE;
DROP TABLE IF EXISTS product_templates CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

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

-- Create trigger function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
CREATE TRIGGER update_users_modified
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Sellers table with PostGIS geography for location
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

-- Add trigger to sellers table
CREATE TRIGGER update_sellers_modified
BEFORE UPDATE ON sellers
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add spatial index for efficient geolocation queries
CREATE INDEX sellers_location_idx ON sellers USING GIST (current_location);
-- Add index on is_open for filtering active sellers
CREATE INDEX sellers_is_open_idx ON sellers (is_open);
-- Add index for phone number lookups
CREATE INDEX sellers_phone_idx ON sellers (phone_number);

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

-- Add trigger to buyers table
CREATE TRIGGER update_buyers_modified
BEFORE UPDATE ON buyers
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add spatial index for buyer locations
CREATE INDEX buyers_location_idx ON buyers USING GIST (current_location);
-- Add index for phone number lookups
CREATE INDEX buyers_phone_idx ON buyers (phone_number);

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

-- Add trigger to products table
CREATE TRIGGER update_products_modified
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add indexes for product searches
CREATE INDEX products_seller_id_idx ON products(seller_id);
CREATE INDEX products_type_idx ON products(product_type);
CREATE INDEX products_available_seller_idx ON products(seller_id, is_available);

-- Liked (favorites) table - many-to-many relationship
CREATE TABLE liked (
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (buyer_id, seller_id) -- Composite primary key prevents duplicate entries
);

-- Add indexes for liked table
CREATE INDEX liked_buyer_idx ON liked(buyer_id);
CREATE INDEX liked_seller_idx ON liked(seller_id);

-- Orders table
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyers(buyer_id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger to orders table
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
CREATE INDEX order_items_product_id_idx ON order_items(product_id);

-- Location history table for sellers (useful for analytics and tracking patterns)
CREATE TABLE seller_location_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for location history
CREATE INDEX location_history_seller_idx ON seller_location_history(seller_id);
CREATE INDEX location_history_time_idx ON seller_location_history(timestamp);
CREATE INDEX location_history_location_idx ON seller_location_history USING GIST (location);

-- =====================================================
-- FUNCTIONS FOR LOCATION AND BUSINESS LOGIC
-- =====================================================

-- Function to find nearby sellers within a specified radius
CREATE OR REPLACE FUNCTION find_nearby_sellers(
  buyer_lat DOUBLE PRECISION,
  buyer_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5.0
)
RETURNS TABLE (
  seller_id UUID,
  name VARCHAR(100),
  logo_url TEXT,
  address TEXT,
  is_open BOOLEAN,
  updated_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.seller_id,
    s.name,
    s.logo_url,
    s.address,
    s.is_open,
    s.updated_at,
    ST_Y(s.current_location::geometry) as latitude,
    ST_X(s.current_location::geometry) as longitude,
    ST_Distance(
      s.current_location,
      ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography
    ) / 1000.0 as distance_km
  FROM sellers s
  WHERE 
    s.current_location IS NOT NULL
    AND ST_DWithin(
      s.current_location,
      ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update seller's current location with history tracking
CREATE OR REPLACE FUNCTION update_seller_location(
  seller_uuid UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the seller's current location
  UPDATE sellers 
  SET 
    current_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    updated_at = NOW()
  WHERE seller_id = seller_uuid;
  
  -- Record in history table for analytics
  INSERT INTO seller_location_history (seller_id, location)
  VALUES (seller_uuid, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate order total automatically
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the order total when order items change
  IF TG_OP = 'DELETE' THEN
    UPDATE orders
    SET total_amount = COALESCE((
      SELECT SUM(subtotal)
      FROM order_items
      WHERE order_id = OLD.order_id
    ), 0)
    WHERE order_id = OLD.order_id;
    RETURN OLD;
  ELSE
    UPDATE orders
    SET total_amount = COALESCE((
      SELECT SUM(subtotal)
      FROM order_items
      WHERE order_id = NEW.order_id
    ), 0)
    WHERE order_id = NEW.order_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic order total calculation
CREATE TRIGGER update_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION calculate_order_total();

-- Function to get seller dashboard statistics
CREATE OR REPLACE FUNCTION get_seller_dashboard_stats(seller_uuid UUID)
RETURNS TABLE (
  pending_orders INTEGER,
  completed_orders_today INTEGER,
  total_revenue_today DECIMAL(10,2),
  liked_by_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*)::INTEGER FROM orders WHERE seller_id = seller_uuid AND status = 'pending'), 0) as pending_orders,
    COALESCE((SELECT COUNT(*)::INTEGER FROM orders WHERE seller_id = seller_uuid AND status = 'completed' AND created_at >= CURRENT_DATE), 0) as completed_orders_today,
    COALESCE((SELECT SUM(total_amount) FROM orders WHERE seller_id = seller_uuid AND status = 'completed' AND created_at >= CURRENT_DATE), 0) as total_revenue_today,
    COALESCE((SELECT COUNT(*)::INTEGER FROM liked WHERE seller_id = seller_uuid), 0) as liked_by_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample users
INSERT INTO users (phone_number, is_verified, user_type) VALUES
('+1234567890', true, 'seller'),
('+1234567891', true, 'seller'),
('+1234567892', true, 'buyer'),
('+1234567893', true, 'buyer');

-- Insert sample sellers with locations in San Francisco area
INSERT INTO sellers (phone_number, name, current_location, logo_url, address, is_open) VALUES
('+1234567890', 'Fresh Fruits & Veggies', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 'https://via.placeholder.com/100?text=FF', '123 Market St, San Francisco, CA', true),
('+1234567891', 'Artisan Bakery Cart', ST_SetSRID(ST_MakePoint(-122.4094, 37.7849), 4326)::geography, 'https://via.placeholder.com/100?text=AB', '456 Mission St, San Francisco, CA', true);

-- Insert sample buyers
INSERT INTO buyers (phone_number, name, current_location, profile_pic_url, address) VALUES
('+1234567892', 'John Doe', ST_SetSRID(ST_MakePoint(-122.4094, 37.7749), 4326)::geography, 'https://via.placeholder.com/100?text=JD', '789 Pine St, San Francisco, CA'),
('+1234567893', 'Jane Smith', ST_SetSRID(ST_MakePoint(-122.4294, 37.7649), 4326)::geography, 'https://via.placeholder.com/100?text=JS', '321 Oak St, San Francisco, CA');

-- Insert sample products
INSERT INTO products (seller_id, name, description, price, price_unit, product_type, image_url) 
SELECT 
  s.seller_id,
  'Fresh Apples',
  'Crispy red apples from local farms',
  3.50,
  'lb',
  'fruits',
  'https://via.placeholder.com/200?text=Apples'
FROM sellers s WHERE s.name = 'Fresh Fruits & Veggies';

INSERT INTO products (seller_id, name, description, price, price_unit, product_type, image_url) 
SELECT 
  s.seller_id,
  'Sourdough Bread',
  'Freshly baked artisan sourdough',
  8.00,
  'loaf',
  'prepared_food',
  'https://via.placeholder.com/200?text=Bread'
FROM sellers s WHERE s.name = 'Artisan Bakery Cart';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Create a function to verify the setup
CREATE OR REPLACE FUNCTION verify_schema_setup()
RETURNS TEXT AS $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  seller_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'sellers', 'buyers', 'products', 'orders', 'order_items', 'liked', 'seller_location_history');
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN ('find_nearby_sellers', 'update_seller_location', 'get_seller_dashboard_stats');
  
  -- Count sample sellers
  SELECT COUNT(*) INTO seller_count FROM sellers;
  
  RETURN format('✅ Schema setup complete! Tables: %s/8, Functions: %s/3, Sample sellers: %s', 
                table_count, function_count, seller_count);
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT verify_schema_setup();

-- Test the find_nearby_sellers function with sample data
SELECT 'Testing find_nearby_sellers function:' as test_message;
SELECT * FROM find_nearby_sellers(37.7749, -122.4194, 10.0); 