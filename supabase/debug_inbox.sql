-- ตรวจสอบ Conversations ทั้งหมด
SELECT 
  c.id,
  c.status,
  c.channel,
  c.business_id,
  c.created_at,
  c.last_message_at,
  ct.name as contact_name,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
FROM conversations c
LEFT JOIN contacts ct ON c.contact_id = ct.id
ORDER BY c.last_message_at DESC;

-- ตรวจสอบว่า User มี Business ID อะไร
SELECT 
  bm.user_id,
  bm.business_id,
  b.name as business_name,
  bm.role,
  bm.status
FROM business_members bm
JOIN businesses b ON bm.business_id = b.id
WHERE bm.user_id = auth.uid();

-- ตรวจสอบ Messages
SELECT 
  m.id,
  m.conversation_id,
  m.content,
  m.direction,
  m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 10;

