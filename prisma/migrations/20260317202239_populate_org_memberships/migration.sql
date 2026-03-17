-- Populate org_memberships from existing users
INSERT INTO org_memberships (id, user_id, org_id, role_id, created_at)
SELECT gen_random_uuid(), id, org_id, role_id, created_at
FROM users
ON CONFLICT (user_id, org_id) DO NOTHING;
