-- Function to get aggregated products from nearby sellers and liked sellers
CREATE OR REPLACE FUNCTION get_aggregated_products(
  buyer_id_param UUID,
  buyer_lat DOUBLE PRECISION,
  buyer_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 0.5
)
RETURNS TABLE (
  product_name VARCHAR(100),
  product_description TEXT,
  product_image_url TEXT,
  product_type VARCHAR(20),
  price_unit VARCHAR(20),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  seller_count BIGINT,
  sellers_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH nearby_sellers AS (
    -- Get sellers within radius
    SELECT DISTINCT s.seller_id, s.name as seller_name, s.logo_url, s.is_open
    FROM sellers s
    WHERE s.current_location IS NOT NULL
      AND s.is_open = true
      AND ST_DWithin(
        s.current_location,
        ST_SetSRID(ST_MakePoint(buyer_lng, buyer_lat), 4326)::geography,
        radius_km * 1000
      )
  ),
  liked_sellers AS (
    -- Get buyer's liked sellers that are open
    SELECT DISTINCT s.seller_id, s.name as seller_name, s.logo_url, s.is_open
    FROM buyer_liked_sellers bls
    JOIN sellers s ON bls.seller_id = s.seller_id
    WHERE bls.buyer_id = buyer_id_param
      AND s.is_open = true
  ),
  all_relevant_sellers AS (
    -- Combine nearby and liked sellers
    SELECT * FROM nearby_sellers
    UNION
    SELECT * FROM liked_sellers
  ),
  products_with_sellers AS (
    -- Get all products from relevant sellers
    SELECT 
      p.product_id,
      p.name,
      p.description,
      p.image_url,
      p.product_type::text,
      p.price_unit,
      p.price,
      ars.seller_id,
      ars.seller_name,
      ars.logo_url,
      ars.is_open
    FROM products p
    JOIN all_relevant_sellers ars ON p.seller_id = ars.seller_id
    WHERE p.is_available = true
  )
  -- Aggregate products by name to remove duplicates
  SELECT 
    pws.name as product_name,
    MAX(pws.description) as product_description,
    MAX(pws.image_url) as product_image_url,
    MAX(pws.product_type)::VARCHAR(20) as product_type,
    MAX(pws.price_unit)::VARCHAR(20) as price_unit,
    MIN(pws.price) as min_price,
    MAX(pws.price) as max_price,
    COUNT(DISTINCT pws.seller_id) as seller_count,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'seller_id', pws.seller_id,
        'seller_name', pws.seller_name,
        'seller_logo', pws.logo_url,
        'price', pws.price,
        'is_open', pws.is_open
      )
    ) as sellers_info
  FROM products_with_sellers pws
  GROUP BY pws.name
  ORDER BY seller_count DESC, min_price ASC;
END;
$$ LANGUAGE plpgsql;