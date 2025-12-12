-- ===================================
-- SUPABASE STORAGE SETUP
-- สำหรับเก็บไฟล์และรูปภาพ
-- ===================================

-- 1. สร้าง storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. ตั้งค่า storage policies
CREATE POLICY "Users can upload files for their business"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view files from their business"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their business files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

-- 3. อัปเดต messages table - เพิ่ม columns สำหรับไฟล์
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 4. สร้าง index สำหรับ query ที่มีไฟล์
CREATE INDEX IF NOT EXISTS idx_messages_with_files 
ON messages(conversation_id) 
WHERE file_url IS NOT NULL;

-- 5. ตรวจสอบ
SELECT 
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_type_count
FROM storage.buckets
WHERE id = 'chat-files';

-- 6. ตรวจสอบ columns ใหม่
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages' 
AND column_name IN ('file_url', 'file_name', 'file_type', 'file_size')
ORDER BY ordinal_position;

