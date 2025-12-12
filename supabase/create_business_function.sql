-- Function to create business and add owner as member
-- This runs with SECURITY DEFINER to bypass RLS during initial setup
CREATE OR REPLACE FUNCTION create_business_with_owner(
  business_name TEXT,
  business_slug TEXT,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_business_id UUID;
BEGIN
  -- Insert business
  INSERT INTO businesses (name, slug, owner_id)
  VALUES (business_name, business_slug, user_id)
  RETURNING id INTO new_business_id;
  
  -- Add owner as business member
  INSERT INTO business_members (business_id, user_id, role, status)
  VALUES (new_business_id, user_id, 'owner', 'active');
  
  RETURN new_business_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_business_with_owner(TEXT, TEXT, UUID) TO authenticated;

