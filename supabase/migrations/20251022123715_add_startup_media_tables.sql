/*
  # Add Startup Media Support

  1. New Tables
    - `startup_media`
      - `id` (uuid, primary key)
      - `startup_id` (uuid, foreign key to startup_profiles)
      - `media_type` (text) - 'image', 'video', or 'document'
      - `file_url` (text) - URL to the file in storage
      - `file_name` (text) - Original file name
      - `file_size` (bigint) - File size in bytes
      - `mime_type` (text) - MIME type of the file
      - `display_order` (integer) - Order for displaying media
      - `is_primary` (boolean) - Whether this is the primary image
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on startup_media table
    - Add policies for viewing media (public)
    - Add policies for managing media (startup owners only)

  3. Storage
    - Create storage buckets for media files
*/

-- Create startup_media table
CREATE TABLE IF NOT EXISTS startup_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid REFERENCES startup_profiles(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_startup_media_startup_id ON startup_media(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_type ON startup_media(media_type);
CREATE INDEX IF NOT EXISTS idx_startup_media_primary ON startup_media(startup_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE startup_media ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view startup media
CREATE POLICY "Anyone can view startup media"
  ON startup_media
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Startup owners can insert their own media
CREATE POLICY "Startups can insert own media"
  ON startup_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM startup_profiles
      WHERE startup_profiles.id = startup_media.startup_id
      AND startup_profiles.user_id = auth.uid()
    )
  );

-- Policy: Startup owners can update their own media
CREATE POLICY "Startups can update own media"
  ON startup_media
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM startup_profiles
      WHERE startup_profiles.id = startup_media.startup_id
      AND startup_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM startup_profiles
      WHERE startup_profiles.id = startup_media.startup_id
      AND startup_profiles.user_id = auth.uid()
    )
  );

-- Policy: Startup owners can delete their own media
CREATE POLICY "Startups can delete own media"
  ON startup_media
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM startup_profiles
      WHERE startup_profiles.id = startup_media.startup_id
      AND startup_profiles.user_id = auth.uid()
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('startup-images', 'startup-images', true),
  ('startup-videos', 'startup-videos', true),
  ('startup-documents', 'startup-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for startup-images bucket
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'startup-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'startup-images');

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'startup-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'startup-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for startup-videos bucket
CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'startup-videos');

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'startup-videos');

CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'startup-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'startup-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for startup-documents bucket
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'startup-documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'startup-documents');

CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'startup-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'startup-documents' AND auth.uid()::text = (storage.foldername(name))[1]);