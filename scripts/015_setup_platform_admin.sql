-- Script to set up platform admin (ookayiztall@gmail.com)
-- Run this after the user has signed up and verified their email
-- Replace the email address if needed

-- Update the profile to set admin role for the platform super admin
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'ookayiztall@gmail.com'
);

-- Verify the update
SELECT id, email FROM auth.users WHERE email = 'ookayiztall@gmail.com';
