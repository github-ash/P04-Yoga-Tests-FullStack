INSERT INTO users(first_name, last_name, admin, email, password)
SELECT 'Admin', 'Admin', true, 'yoga@studio.com', '$2a$10$.Hsa/ZjUVaHqi0tp9xieMeewrnZxrZ5pQRzddUXE/WjDu2ZThe6Iq'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'yoga@studio.com');

INSERT INTO teachers(first_name, last_name, created_at, updated_at)
SELECT 'Jane', 'Doe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE first_name = 'Jane' AND last_name = 'Doe');