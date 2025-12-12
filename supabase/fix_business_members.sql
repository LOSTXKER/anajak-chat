-- ============================================
-- Fix Missing Business Members
-- Run this if you get "No business found" error
-- ============================================

DO $$
DECLARE
  business_record RECORD;
BEGIN
  RAISE NOTICE 'Starting to fix business members...';
  
  -- For each business where owner is not in business_members
  FOR business_record IN 
    SELECT b.id, b.owner_id, b.name
    FROM businesses b
    WHERE NOT EXISTS (
      SELECT 1 FROM business_members bm 
      WHERE bm.business_id = b.id 
      AND bm.user_id = b.owner_id
    )
  LOOP
    RAISE NOTICE 'Adding owner to business: %', business_record.name;
    
    -- Insert business owner as member
    INSERT INTO business_members (business_id, user_id, role, status)
    VALUES (
      business_record.id,
      business_record.owner_id,
      'owner',
      'active'
    )
    ON CONFLICT (business_id, user_id) DO NOTHING;
    
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Fixed business members!';
  RAISE NOTICE '========================================';
  
  -- Show summary
  RAISE NOTICE 'Total businesses: %', (SELECT COUNT(*) FROM businesses);
  RAISE NOTICE 'Total business members: %', (SELECT COUNT(*) FROM business_members);
  
END $$;

-- Verify the fix
SELECT 
  b.name as business_name,
  b.owner_id,
  CASE 
    WHEN bm.id IS NOT NULL THEN '✅ Has member record'
    ELSE '❌ Missing member record'
  END as status
FROM businesses b
LEFT JOIN business_members bm ON b.id = bm.business_id AND b.owner_id = bm.user_id;

