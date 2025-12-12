-- ============================================
-- SIMPLE FIX - แก้ปัญหาแบบง่าย ๆ
-- รัน script เดียวจบ!
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
BEGIN
  -- Get first user
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ ไม่พบ user! กรุณาลงทะเบียนก่อน';
  END IF;
  
  -- Get or create business
  SELECT id INTO v_business_id FROM businesses WHERE owner_id = v_user_id LIMIT 1;
  
  IF v_business_id IS NULL THEN
    INSERT INTO businesses (name, slug, owner_id)
    VALUES ('My Business', 'my-business', v_user_id)
    RETURNING id INTO v_business_id;
    RAISE NOTICE '✅ สร้าง business ใหม่';
  ELSE
    RAISE NOTICE '✅ พบ business แล้ว';
  END IF;
  
  -- Create business_member if not exists
  INSERT INTO business_members (business_id, user_id, role, status)
  VALUES (v_business_id, v_user_id, 'owner', 'active')
  ON CONFLICT (business_id, user_id) DO UPDATE
  SET role = 'owner', status = 'active';
  
  RAISE NOTICE '✅ business_member พร้อมแล้ว';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 เสร็จสิ้น! ลอง refresh dashboard แล้วใช้งานได้เลย';
  RAISE NOTICE '========================================';
END $$;

-- แสดงผลลัพธ์
SELECT 
  u.email as "อีเมล",
  b.name as "ธุรกิจ",
  bm.role as "บทบาท",
  CASE WHEN bm.status = 'active' THEN '✅ พร้อมใช้งาน' ELSE '❌ ไม่ active' END as "สถานะ"
FROM auth.users u
JOIN businesses b ON b.owner_id = u.id
JOIN business_members bm ON bm.business_id = b.id AND bm.user_id = u.id
ORDER BY u.created_at
LIMIT 1;

