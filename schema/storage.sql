-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product_images', 'product_images', true),
  ('profile_pictures', 'profile_pictures', true),
  ('seller_logos', 'seller_logos', true);

-- Policies for product_images bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product_images');

CREATE POLICY "Seller Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product_images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN sellers s ON s.phone_number = u.phone_number
    WHERE u.phone_number = auth.uid()::text
  )
);

CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product_images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.phone_number = auth.uid()::text
    AND (storage.foldername(name))[1] = u.phone_number
  )
);

-- Policies for profile_pictures bucket
CREATE POLICY "Public Profile Pictures Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pictures');

CREATE POLICY "User Upload Profile Picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_pictures'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.phone_number = auth.uid()::text
    AND (storage.foldername(name))[1] = u.phone_number
  )
);

CREATE POLICY "Owner Delete Profile Picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile_pictures'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.phone_number = auth.uid()::text
    AND (storage.foldername(name))[1] = u.phone_number
  )
);

-- Policies for seller_logos bucket
CREATE POLICY "Public Logos Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller_logos');

CREATE POLICY "Seller Upload Logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'seller_logos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN sellers s ON s.phone_number = u.phone_number
    WHERE u.phone_number = auth.uid()::text
    AND (storage.foldername(name))[1] = u.phone_number
  )
);

CREATE POLICY "Owner Delete Logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'seller_logos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN sellers s ON s.phone_number = u.phone_number
    WHERE u.phone_number = auth.uid()::text
    AND (storage.foldername(name))[1] = u.phone_number
  )
); 