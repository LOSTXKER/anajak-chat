-- ============================================
-- Auto Mock Data Script
-- This will automatically use the first user and business
-- No need to replace any IDs!
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_channel_fb UUID;
  v_channel_line UUID;
  v_channel_web UUID;
  v_contact_1 UUID;
  v_contact_2 UUID;
  v_contact_3 UUID;
  v_conv_1 UUID;
BEGIN
  -- Get first user (the one you created during registration)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  -- Get first business
  SELECT id INTO v_business_id FROM businesses ORDER BY created_at LIMIT 1;
  
  RAISE NOTICE 'Using User ID: %', v_user_id;
  RAISE NOTICE 'Using Business ID: %', v_business_id;
  
  -- Check if we have user and business
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found! Please create an account first.';
  END IF;
  
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'No business found! Please register first.';
  END IF;
  
  -- ============================================
  -- 1. CREATE MOCK CHANNELS
  -- ============================================
  RAISE NOTICE 'Creating channels...';
  
  INSERT INTO channels (business_id, type, name, status) 
  VALUES (v_business_id, 'facebook', 'Facebook Page', 'connected')
  RETURNING id INTO v_channel_fb;
  
  INSERT INTO channels (business_id, type, name, status) 
  VALUES (v_business_id, 'line', 'LINE Official', 'connected')
  RETURNING id INTO v_channel_line;
  
  INSERT INTO channels (business_id, type, name, status) 
  VALUES (v_business_id, 'instagram', 'Instagram', 'disconnected');
  
  INSERT INTO channels (business_id, type, name, status) 
  VALUES (v_business_id, 'web', 'Website Chat', 'connected')
  RETURNING id INTO v_channel_web;
  
  RAISE NOTICE 'Created 4 channels';
  
  -- ============================================
  -- 2. CREATE MOCK CONTACTS
  -- ============================================
  RAISE NOTICE 'Creating contacts...';
  
  INSERT INTO contacts (business_id, name, email, phone, tags) 
  VALUES (v_business_id, 'สมชาย ใจดี', 'somchai@example.com', '0812345678', ARRAY['ลูกค้าประจำ', 'VIP'])
  RETURNING id INTO v_contact_1;
  
  INSERT INTO contacts (business_id, name, email, phone, tags) 
  VALUES (v_business_id, 'สมหญิง รักสวย', 'somying@example.com', '0823456789', ARRAY['ลูกค้าใหม่'])
  RETURNING id INTO v_contact_2;
  
  INSERT INTO contacts (business_id, name, email, phone, tags) 
  VALUES (v_business_id, 'ทดสอบ ทดลอง', 'test@example.com', '0834567890', ARRAY['ทดสอบ'])
  RETURNING id INTO v_contact_3;
  
  INSERT INTO contacts (business_id, name, email, phone, tags) 
  VALUES (v_business_id, 'ลูกค้า A', 'customer_a@example.com', '0845678901', ARRAY['สนใจสินค้า']);
  
  INSERT INTO contacts (business_id, name, email, phone, tags) 
  VALUES (v_business_id, 'ลูกค้า B', 'customer_b@example.com', '0856789012', ARRAY['ติดต่อประจำ']);
  
  RAISE NOTICE 'Created 5 contacts';
  
  -- ============================================
  -- 3. CREATE MOCK CONVERSATIONS
  -- ============================================
  RAISE NOTICE 'Creating conversations...';
  
  -- Conversation 1: Open conversation
  INSERT INTO conversations (
    business_id, 
    contact_id, 
    channel_id, 
    status, 
    priority, 
    assigned_to,
    last_message_at,
    risk_level
  ) VALUES (
    v_business_id,
    v_contact_1,
    v_channel_fb,
    'open',
    'high',
    NULL,
    NOW() - INTERVAL '5 minutes',
    'none'
  ) RETURNING id INTO v_conv_1;
  
  -- Conversation 2: Claimed conversation
  INSERT INTO conversations (
    business_id, 
    contact_id, 
    channel_id, 
    status, 
    priority, 
    assigned_to,
    last_message_at,
    risk_level
  ) VALUES (
    v_business_id,
    v_contact_2,
    v_channel_line,
    'claimed',
    'medium',
    v_user_id,
    NOW() - INTERVAL '1 hour',
    'low'
  );
  
  -- Conversation 3: Resolved conversation
  INSERT INTO conversations (
    business_id, 
    contact_id, 
    channel_id, 
    status, 
    priority, 
    assigned_to,
    last_message_at,
    risk_level
  ) VALUES (
    v_business_id,
    v_contact_3,
    v_channel_web,
    'resolved',
    'low',
    v_user_id,
    NOW() - INTERVAL '1 day',
    'none'
  );
  
  RAISE NOTICE 'Created 3 conversations';
  
  -- ============================================
  -- 4. CREATE MOCK MESSAGES
  -- ============================================
  RAISE NOTICE 'Creating messages...';
  
  -- Messages for conversation 1
  INSERT INTO messages (
    conversation_id, business_id, sender_type, sender_id, content, content_type, created_at
  ) VALUES (
    v_conv_1, v_business_id, 'contact', NULL, 
    'สวัสดีครับ สนใจสินค้าของทางร้านครับ', 'text',
    NOW() - INTERVAL '10 minutes'
  );
  
  INSERT INTO messages (
    conversation_id, business_id, sender_type, sender_id, content, content_type, created_at
  ) VALUES (
    v_conv_1, v_business_id, 'contact', NULL, 
    'มีสินค้า Package A หรือเปล่าครับ', 'text',
    NOW() - INTERVAL '5 minutes'
  );
  
  -- Add more messages for other conversations
  INSERT INTO messages (
    conversation_id, business_id, sender_type, sender_id, content, content_type, created_at
  ) VALUES (
    (SELECT id FROM conversations WHERE contact_id = v_contact_2 LIMIT 1),
    v_business_id, 'contact', NULL, 
    'สวัสดีค่ะ', 'text',
    NOW() - INTERVAL '2 hours'
  );
  
  INSERT INTO messages (
    conversation_id, business_id, sender_type, sender_id, content, content_type, created_at
  ) VALUES (
    (SELECT id FROM conversations WHERE contact_id = v_contact_2 LIMIT 1),
    v_business_id, 'agent', v_user_id, 
    'สวัสดีครับ ยินดีให้บริการครับ', 'text',
    NOW() - INTERVAL '1 hour 50 minutes'
  );
  
  INSERT INTO messages (
    conversation_id, business_id, sender_type, sender_id, content, content_type, created_at
  ) VALUES (
    (SELECT id FROM conversations WHERE contact_id = v_contact_2 LIMIT 1),
    v_business_id, 'contact', NULL, 
    'อยากสั่งสินค้าค่ะ', 'text',
    NOW() - INTERVAL '1 hour'
  );
  
  RAISE NOTICE 'Created 5 messages';
  
  -- ============================================
  -- 5. CREATE MOCK ENTITIES
  -- ============================================
  RAISE NOTICE 'Creating entities...';
  
  -- Deal 1: New deal
  INSERT INTO entities (
    business_id, type, title, description, status, priority, value, currency, owner_id, contact_id
  ) VALUES (
    v_business_id, 'deal', 'ขายสินค้า Package A',
    'ลูกค้าสนใจ package A ราคา 50,000 บาท กำลังพิจารณา',
    'new', 'high', 50000, 'THB', v_user_id, v_contact_1
  );
  
  -- Deal 2: Won deal
  INSERT INTO entities (
    business_id, type, title, description, status, priority, value, currency, owner_id, contact_id
  ) VALUES (
    v_business_id, 'deal', 'ปิดการขาย Package B',
    'ลูกค้าสั่งซื้อแล้ว โอนเงินเรียบร้อย',
    'won', 'medium', 35000, 'THB', v_user_id, v_contact_2
  );
  
  -- Ticket: Support ticket
  INSERT INTO entities (
    business_id, type, title, description, status, priority, value, currency, owner_id, contact_id
  ) VALUES (
    v_business_id, 'ticket', 'แก้ไขปัญหาสินค้า',
    'ลูกค้าร้องเรียนสินค้ามีปัญหา กำลังดำเนินการแก้ไข',
    'in_progress', 'urgent', NULL, 'THB', v_user_id, v_contact_3
  );
  
  -- More entities
  INSERT INTO entities (
    business_id, type, title, description, status, priority, value, currency, owner_id, contact_id
  ) VALUES (
    v_business_id, 'deal', 'โอกาสขาย Package C',
    'ลูกค้าติดต่อสอบถามรายละเอียด',
    'new', 'medium', 25000, 'THB', v_user_id, v_contact_1
  );
  
  INSERT INTO entities (
    business_id, type, title, description, status, priority, value, currency, owner_id
  ) VALUES (
    v_business_id, 'work', 'จัดทำเอกสารสรุปประจำเดือน',
    'สรุปยอดขายและผลประกอบการประจำเดือน',
    'in_progress', 'medium', NULL, 'THB', v_user_id
  );
  
  RAISE NOTICE 'Created 5 entities';
  
  -- ============================================
  -- 6. CREATE MOCK AI MEMORIES
  -- ============================================
  RAISE NOTICE 'Creating AI memories...';
  
  INSERT INTO ai_memories (business_id, category, key, value, created_by) VALUES
    (v_business_id, 'tone', 'default_tone', 'พูดจาสุภาพ เป็นกันเอง ใช้ภาษาไทยที่เข้าใจง่าย ไม่เป็นทางการเกินไป', v_user_id),
    (v_business_id, 'policy', 'refund_policy', 'รับคืนสินค้าภายใน 7 วัน หากสินค้าชำรุดหรือไม่ตรงตามที่สั่ง (สินค้าต้องอยู่ในสภาพเดิม)', v_user_id),
    (v_business_id, 'pricing', 'discount_policy', 'ลูกค้าประจำได้ส่วนลด 10% ลูกค้า VIP ได้ส่วนลด 15% ซื้อครบ 100,000 บาทได้ส่วนลด 20%', v_user_id),
    (v_business_id, 'product', 'package_a', 'Package A ราคา 50,000 บาท ประกอบด้วย ระบบจัดการ + การฝึกอบรม + Support 1 ปี', v_user_id),
    (v_business_id, 'product', 'package_b', 'Package B ราคา 35,000 บาท เหมาะสำหรับ SME มีฟีเจอร์ครบ Support 6 เดือน', v_user_id),
    (v_business_id, 'process', 'order_process', 'ขั้นตอนสั่งซื้อ: 1) ส่งใบเสนอราคา 2) รับชำระเงิน 50% 3) เริ่มดำเนินการ 4) ชำระส่วนที่เหลือ 5) ส่งมอบงาน', v_user_id);
  
  RAISE NOTICE 'Created 6 AI memories';
  
  -- ============================================
  -- DONE!
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Mock data created successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- 4 Channels';
  RAISE NOTICE '- 5 Contacts';
  RAISE NOTICE '- 3 Conversations';
  RAISE NOTICE '- 5 Messages';
  RAISE NOTICE '- 5 Entities';
  RAISE NOTICE '- 6 AI Memories';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Now refresh your app and enjoy! 🎉';
  
END $$;

