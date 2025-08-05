-- Test kullanıcıları ekle
INSERT INTO users (id, email, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'test1@gmail.com', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'test2@gmail.com', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'admin@gmail.com', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'user@gmail.com', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'demo@gmail.com', NOW(), NOW());

-- Test kategorileri ekle
INSERT INTO categories (id, user_id, name, color, icon, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Market', '#4caf50', '🛒', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Yemek', '#ff9800', '🍔', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Ulaşım', '#2196f3', '🚕', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Fatura', '#e53935', '💡', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Gelir', '#9c27b0', '💰', NOW(), NOW());

-- Test hesapları ekle
INSERT INTO accounts (id, user_id, account_name, account_type, balance, currency, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Ana Hesap', 'Vadesiz', 5000.00, 'TRY', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Tasarruf Hesabı', 'Vadeli', 15000.00, 'TRY', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Kredi Kartı', 'Kredi Kartı', -2500.00, 'TRY', NOW(), NOW());

-- Test işlemleri ekle
INSERT INTO transactions (id, account_id, category_id, amount, transaction_date, description, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', -150.50, '2024-01-15', 'Market alışverişi', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', -75.00, '2024-01-16', 'Restoran', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', -25.00, '2024-01-17', 'Taksi', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 5000.00, '2024-01-18', 'Maaş', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', -200.00, '2024-01-19', 'Elektrik faturası', NOW(), NOW()); 