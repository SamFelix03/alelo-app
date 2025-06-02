-- Add this function to your Supabase SQL Editor to fix location retrieval
-- This function properly extracts latitude and longitude from PostGIS geography data

CREATE OR REPLACE FUNCTION get_seller_location(seller_uuid UUID)
RETURNS TABLE (
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ST_Y(s.current_location::geometry) as latitude,
    ST_X(s.current_location::geometry) as longitude
  FROM sellers s
  WHERE s.seller_id = seller_uuid
    AND s.current_location IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 