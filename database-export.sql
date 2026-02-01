-- BooksSwap Database Export
-- Generated for Hostinger migration

-- Users table data
INSERT INTO users (id, name, postcode, swaps, created_at, email, password_hash, subscription_status, stripe_customer_id) VALUES
('8ab95cdf-8b54-4978-9b4e-95093f812537', 'Test User', 'SW1A', 0, '2026-01-31 18:58:46.876251', 'Test User@temp.com', 'temp_hash', 'inactive', NULL),
('bcee1795-dce2-41b4-99ec-89e40e895dcd', 'Jane Doe', 'EC1A', 0, '2026-01-31 19:00:08.948556', 'Jane Doe@temp.com', 'temp_hash', 'inactive', NULL),
('69367eed-0fcc-45d5-9a99-161320a1471a', 'kwame', 'SW129RW', 0, '2026-01-31 20:27:50.598816', 'kwame@temp.com', 'temp_hash', 'inactive', NULL),
('a74aab65-1d3d-4e1a-b8b9-84044c28ca52', 'kwame', 'SW129RW', 0, '2026-01-31 22:37:59.070672', '7inmedia@gmail.com', '$2b$10$D0vnRD9VAwdIjPIQ0NRhweeZ16Do8EXiBCjGEByr4WRQx0jrhbigi', 'inactive', NULL),
('35a4e549-baa3-4a91-985c-7de7c7ea56a7', 'kwame', 'SW129RW', 0, '2026-01-31 23:37:39.753527', 'malikmahama30@gmail.com', '$2b$10$oKp/rfBVROvNYXVBagrzbuHb54vfeqIvhVfqPvLVXMzevchdAYjD2', 'inactive', NULL);

-- Books table (currently empty)
-- No books data to export

-- Badges table (currently empty)
-- No badges data to export

-- Swap requests table (currently empty)
-- No swap requests data to export
