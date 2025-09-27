-- Update another user to have "servo de balcao" role to demonstrate the functionality works for all users with this role
UPDATE profiles 
SET role = 'servo de balcao' 
WHERE username = 'kelven';

-- Verify the current roles distribution
SELECT role, COUNT(*) as total_users 
FROM profiles 
GROUP BY role 
ORDER BY role;