START TRANSACTION;

-- Select the product row for update
SELECT availabl_quantity FROM products 
WHERE product_id = 1 FOR UPDATE;

-- Code logic: Check if availabl_quantity > 0;

-- Create a purchase
INSERT INTO purchase (user_id, product_id, purchase_quantity)
VALUES(123, 1, 1);

-- Perform operations on the selected data
UPDATE products 
SET available_quantity = availabl_quantity - 1,
WHERE product_id = 1;

-- 
COMMIT
