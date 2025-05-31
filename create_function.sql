-- Create the find_nearby_sellers function for real-time location queries
-- Run this in your Supabase SQL Editor

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