-- Check current version of the product
SELECT available_quantity FROM products WHERE product_id = 1;

-- Update product price (assuming version 1)
UPDATE products
SET available_quantity = available_quantity - 1,
    version = version + 1
WHERE product_id = 1 AND version = $1;

-- Retry if update count is zero

-- Create purchase if update product successfully 
INSERT INTO purchase (user_id, product_id, purchase_quantity)
VALUES(123, 1, 1);