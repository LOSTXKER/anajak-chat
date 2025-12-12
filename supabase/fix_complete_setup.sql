-- ============================================
-- Complete Fix: Check & Create Everything
-- Run this to fix all business setup issues
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_business_id UUID;
  v_business_exists BOOLEAN;
  v_member_exists BOOLEAN;
BEGIN
  -- Get current user (replace with your email if needed)
  -- Or just get the first user
  SELECT id, email INTO v_user_id, v_user_email 
  FROM auth.users 
  ORDER BY created_at 
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found! Please register first.';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing setup for user: %', v_user_email;
  RAISE NOTICE '========================================';
  
  -- Step 1: Check if business exists
  SELECT id INTO v_business_id 
  FROM businesses 
  WHERE owner_id = v_user_id 
  LIMIT 1;
  
  IF v_business_id IS NOT NULL THEN
    RAISE NOTICE '✅ Business exists: %', v_business_id;
    v_business_exists := TRUE;
  ELSE
    RAISE NOTICE '❌ No business found. Creating...';
    v_business_exists := FALSE;
    
    -- Create business
    INSERT INTO businesses (name, slug, owner_id)
    VALUES (
      'My Business',
      'my-business-' || substr(v_user_id::text, 1, 8),
      v_user_id
    )
    RETURNING id INTO v_business_id;
    
    RAISE NOTICE '✅ Created business: %', v_business_id;
  END IF;
  
  -- Step 2: Check if business_member exists
  SELECT EXISTS(
    SELECT 1 FROM business_members 
    WHERE business_id = v_business_id 
    AND user_id = v_user_id
  ) INTO v_member_exists;
  
  IF v_member_exists THEN
    RAISE NOTICE '✅ Business member record exists';
  ELSE
    RAISE NOTICE '❌ No business member record. Creating...';
    
    -- Create business_member
    INSERT INTO business_members (business_id, user_id, role, status)
    VALUES (v_business_id, v_user_id, 'owner', 'active')
    ON CONFLICT (business_id, user_id) DO NOTHING;
    
    RAISE NOTICE '✅ Created business member record';
  END IF;
  
  -- Step 3: Verify everything
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'User Email: %', v_user_email;
  RAISE NOTICE 'Business ID: %', v_business_id;
  
  -- Check if user can see their business
  IF EXISTS(
    SELECT 1 FROM businesses 
    WHERE id = v_business_id 
    AND (owner_id = v_user_id OR id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = v_user_id AND status = 'active'
    ))
  ) THEN
    RAISE NOTICE '✅ RLS check passed: User can access business';
  ELSE
    RAISE NOTICE '⚠️  RLS check failed: User cannot access business';
    RAISE NOTICE 'This might be a RLS policy issue';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Setup complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'You can now use the dashboard';
  
END $$;

-- Show final status
SELECT * FROM (
  SELECT 
    'User' as type,
    u.email as identifier,
    u.id::text as id,
    1 as sort_order
  FROM auth.users u
  ORDER BY u.created_at
  LIMIT 1
) user_data

UNION ALL

SELECT * FROM (
  SELECT 
    'Business' as type,
    b.name as identifier,
    b.id::text as id,
    2 as sort_order
  FROM businesses b
  JOIN auth.users u ON b.owner_id = u.id
  ORDER BY b.created_at
  LIMIT 1
) business_data

UNION ALL

SELECT * FROM (
  SELECT 
    'Member' as type,
    bm.role as identifier,
    bm.id::text as id,
    3 as sort_order
  FROM business_members bm
  JOIN auth.users u ON bm.user_id = u.id
  ORDER BY bm.created_at
  LIMIT 1
) member_data
ORDER BY sort_order;

