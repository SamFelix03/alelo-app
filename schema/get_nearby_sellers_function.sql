-- Function to find nearby sellers within a specified radius
-- This function uses PostGIS geography functions for accurate distance calculations

CREATE OR REPLACE FUNCTION get_nearby_sellers(
  buyer_lat DOUBLE PRECISION,
  buyer_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  seller_id UUID,
  name TEXT,
  logo_url TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance DOUBLE PRECISION,
  is_open BOOLEAN,
  rating DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.seller_id,
    s.name,
    s.logo_url,
    s.address,
    ST_Y(s.current_location::geometry) as latitude,
    ST_X(s.current_location::geometry) as longitude,
    ST_Distance(
      ST_GeographyFromText('POINT(' || buyer_lng || ' ' || buyer_lat || ')'),
      s.current_location
    ) as distance,
    s.is_open,
    4.5::DOUBLE PRECISION as rating -- Default rating for now
  FROM sellers s
  WHERE s.current_location IS NOT NULL
    AND ST_DWithin(
      ST_GeographyFromText('POINT(' || buyer_lng || ' ' || buyer_lat || ')'),
      s.current_location,
      radius_meters
    )
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_sellers(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated; 