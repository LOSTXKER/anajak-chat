-- ============================================
-- Mock Data for Testing
-- Run this AFTER you've created your first account
-- Replace 'YOUR_USER_ID' and 'YOUR_BUSINESS_ID' with actual IDs
-- ============================================

-- Get your user_id from: SELECT id FROM auth.users;
-- Get your business_id from: SELECT id FROM businesses;

-- Variables (REPLACE THESE!)
-- YOUR_USER_ID: Get from auth.users table
-- YOUR_BUSINESS_ID: Get from businesses table

-- ============================================
-- 1. CREATE MOCK CHANNELS
-- ============================================
INSERT INTO channels (business_id, type, name, status) VALUES
  ('YOUR_BUSINESS_ID', 'facebook', 'Facebook Page', 'connected'),
  ('YOUR_BUSINESS_ID', 'line', 'LINE Official', 'connected'),
  ('YOUR_BUSINESS_ID', 'instagram', 'Instagram', 'disconnected'),
  ('YOUR_BUSINESS_ID', 'web', 'Website Chat', 'connected');

-- ============================================
-- 2. CREATE MOCK CONTACTS
-- ============================================
INSERT INTO contacts (business_id, name, email, phone, tags) VALUES
  ('YOUR_BUSINESS_ID', 'สมชาย ใจดี', 'somchai@example.com', '0812345678', ARRAY['ลูกค้าประจำ', 'VIP']),
  ('YOUR_BUSINESS_ID', 'สมหญิง รักสวย', 'somying@example.com', '0823456789', ARRAY['ลูกค้าใหม่']),
  ('YOUR_BUSINESS_ID', 'ทดสอบ ทดลอง', 'test@example.com', '0834567890', ARRAY['ทดสอบ']),
  ('YOUR_BUSINESS_ID', 'ลูกค้า A', 'customer_a@example.com', '0845678901', ARRAY['สนใจสินค้า']),
  ('YOUR_BUSINESS_ID', 'ลูกค้า B', 'customer_b@example.com', '0856789012', ARRAY['ติดต่อประจำ']);

-- ============================================
-- 3. CREATE MOCK CONVERSATIONS
-- ============================================
-- Get channel_id and contact_id from previous inserts
-- Run: SELECT id, name FROM channels; SELECT id, name FROM contacts;

INSERT INTO conversations (
  business_id, 
  contact_id, 
  channel_id, 
  status, 
  priority, 
  assigned_to,
  last_message_at,
  risk_level
) VALUES
  (
    'YOUR_BUSINESS_ID',
    (SELECT id FROM contacts WHERE email = 'somchai@example.com' LIMIT 1),
    (SELECT id FROM channels WHERE type = 'facebook' LIMIT 1),
    'open',
    'high',
    NULL,
    NOW() - INTERVAL '5 minutes',
    'none'
  ),
  (
    'YOUR_BUSINESS_ID',
    (SELECT id FROM contacts WHERE email = 'somying@example.com' LIMIT 1),
    (SELECT id FROM channels WHERE type = 'line' LIMIT 1),
    'claimed',
    'medium',
    'YOUR_USER_ID',
    NOW() - INTERVAL '1 hour',
    'low'
  ),
  (
    'YOUR_BUSINESS_ID',
    (SELECT id FROM contacts WHERE email = 'test@example.com' LIMIT 1),
    (SELECT id FROM channels WHERE type = 'web' LIMIT 1),
    'resolved',
    'low',
    'YOUR_USER_ID',
    NOW() - INTERVAL '1 day',
    'none'
  );

-- ============================================
-- 4. CREATE MOCK MESSAGES
-- ============================================
INSERT INTO messages (
  conversation_id,
  business_id,
  sender_type,
  sender_id,
  content,
  content_type
)
SELECT 
  c.id,
  c.business_id,
  'contact',
  NULL,
  'สวัสดีครับ สนใจสินค้าของทางร้านครับ',
  'text'
FROM conversations c
WHERE c.contact_id = (SELECT id FROM contacts WHERE email = 'somchai@example.com' LIMIT 1)
LIMIT 1;

INSERT INTO messages (
  conversation_id,
  business_id,
  sender_type,
  sender_id,
  content,
  content_type
)
SELECT 
  c.id,
  c.business_id,
  'agent',
  'YOUR_USER_ID',
  'สวัสดีครับ ยินดีให้บริการครับ มีอะไรให้ช่วยไหมครับ',
  'text'
FROM conversations c
WHERE c.contact_id = (SELECT id FROM contacts WHERE email = 'somchai@example.com' LIMIT 1)
LIMIT 1;

-- ============================================
-- 5. CREATE MOCK ENTITIES
-- ============================================
INSERT INTO entities (
  business_id,
  type,
  title,
  description,
  status,
  priority,
  value,
  currency,
  owner_id,
  contact_id
) VALUES
  (
    'YOUR_BUSINESS_ID',
    'deal',
    'ขายสินค้า Package A',
    'ลูกค้าสนใจ package A ราคา 50,000 บาท',
    'new',
    'high',
    50000,
    'THB',
    'YOUR_USER_ID',
    (SELECT id FROM contacts WHERE email = 'somchai@example.com' LIMIT 1)
  ),
  (
    'YOUR_BUSINESS_ID',
    'deal',
    'ปิดการขาย Package B',
    'ลูกค้าสั่งซื้อแล้ว',
    'won',
    'medium',
    35000,
    'THB',
    'YOUR_USER_ID',
    (SELECT id FROM contacts WHERE email = 'somying@example.com' LIMIT 1)
  ),
  (
    'YOUR_BUSINESS_ID',
    'ticket',
    'แก้ไขปัญหาสินค้า',
    'ลูกค้าร้องเรียนสินค้ามีปัญหา',
    'in_progress',
    'urgent',
    NULL,
    'THB',
    'YOUR_USER_ID',
    (SELECT id FROM contacts WHERE email = 'test@example.com' LIMIT 1)
  );

-- ============================================
-- 6. CREATE MOCK AI MEMORIES
-- ============================================
INSERT INTO ai_memories (
  business_id,
  category,
  key,
  value,
  created_by
) VALUES
  (
    'YOUR_BUSINESS_ID',
    'tone',
    'default_tone',
    'พูดจาสุภาพ เป็นกันเอง ใช้ภาษาไทยที่เข้าใจง่าย',
    'YOUR_USER_ID'
  ),
  (
    'YOUR_BUSINESS_ID',
    'policy',
    'refund_policy',
    'รับคืนสินค้าภายใน 7 วัน หากสินค้าชำรุดหรือไม่ตรงตามที่สั่ง',
    'YOUR_USER_ID'
  ),
  (
    'YOUR_BUSINESS_ID',
    'pricing',
    'discount_policy',
    'ลูกค้าประจำได้ส่วนลด 10% ลูกค้า VIP ได้ 15%',
    'YOUR_USER_ID'
  );

-- ============================================
-- DONE! Mock data created
-- ============================================
-- Now refresh your app and you should see data!

