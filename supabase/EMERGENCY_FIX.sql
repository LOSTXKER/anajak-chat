-- ============================================
-- EMERGENCY FIX - Manual Setup
-- ใช้ script นี้ถ้า automatic fix ไม่ได้
-- ============================================

-- ============================================
-- STEP 1: ตรวจสอบ User ของคุณ
-- ============================================
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at;

-- คัดลอก user_id ของคุณจากผลลัพธ์ด้านบน
-- แทนที่ 'YOUR_USER_ID' ด้านล่างนี้

-- ============================================
-- STEP 2: ตรวจสอบว่ามี Business หรือยัง
-- ============================================
SELECT 
  id as business_id,
  name,
  slug,
  owner_id,
  created_at
FROM businesses
WHERE owner_id = 'YOUR_USER_ID'; -- ← แทนที่ตรงนี้!

-- ถ้าไม่มีผลลัพธ์ → ไป STEP 3
-- ถ้ามี → คัดลอก business_id แล้วไป STEP 4

-- ============================================
-- STEP 3: สร้าง Business ใหม่ (ถ้าไม่มี)
-- ============================================
INSERT INTO businesses (name, slug, owner_id)
VALUES (
  'ธุรกิจของฉัน',                    -- ← เปลี่ยนชื่อได้
  'my-business',                     -- ← เปลี่ยน slug ได้
  'YOUR_USER_ID'                     -- ← แทนที่ user_id ของคุณ
)
RETURNING id, name;

-- คัดลอก id ที่ได้

-- ============================================
-- STEP 4: ตรวจสอบ Business Member
-- ============================================
SELECT 
  id,
  business_id,
  user_id,
  role,
  status
FROM business_members
WHERE user_id = 'YOUR_USER_ID';     -- ← แทนที่ user_id

-- ถ้าไม่มี → ไป STEP 5
-- ถ้ามี → เสร็จแล้ว! ไป STEP 6

-- ============================================
-- STEP 5: สร้าง Business Member (ถ้าไม่มี)
-- ============================================
INSERT INTO business_members (business_id, user_id, role, status)
VALUES (
  'YOUR_BUSINESS_ID',                -- ← แทนที่ business_id จาก STEP 2 หรือ 3
  'YOUR_USER_ID',                    -- ← แทนที่ user_id ของคุณ
  'owner',
  'active'
)
ON CONFLICT (business_id, user_id) DO UPDATE
SET role = 'owner', status = 'active'
RETURNING id;

-- ============================================
-- STEP 6: ตรวจสอบอีกครั้งว่าเสร็จแล้ว
-- ============================================
SELECT 
  u.email as "User Email",
  b.name as "Business Name",
  bm.role as "Role",
  bm.status as "Status",
  CASE 
    WHEN bm.id IS NOT NULL THEN '✅ Setup Complete'
    ELSE '❌ Still Missing'
  END as "Setup Status"
FROM auth.users u
LEFT JOIN businesses b ON b.owner_id = u.id
LEFT JOIN business_members bm ON bm.business_id = b.id AND bm.user_id = u.id
WHERE u.id = 'YOUR_USER_ID';        -- ← แทนที่ user_id

-- ควรเห็น:
-- User Email        | Business Name  | Role  | Status | Setup Status
-- you@example.com   | ธุรกิจของฉัน   | owner | active | ✅ Setup Complete

-- ============================================
-- 🎉 เสร็จแล้ว! ตอนนี้ refresh Dashboard แล้วลองใหม่
-- ============================================

