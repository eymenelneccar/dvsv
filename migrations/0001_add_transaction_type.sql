
-- إضافة عمود نوع المعاملة
ALTER TABLE transactions ADD COLUMN transaction_type VARCHAR DEFAULT 'sale';

-- تحديث القيم الموجودة
UPDATE transactions SET transaction_type = 'sale' WHERE transaction_type IS NULL;

-- تحديث paymentType enum لإضافة debt_collection
-- نظراً لأن PostgreSQL لا يدعم تعديل enum مباشرة، سنستخدم ALTER TYPE
-- ولكن في حالتنا العمود varchar لذا لا حاجة لتعديل خاص
