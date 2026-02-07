SELECT id, email, password_hash IS NOT NULL as has_password_hash, LENGTH(password_hash) as hash_length
FROM users  
WHERE email = 'admin@monopilot.com';
