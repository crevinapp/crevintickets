-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Update existing records to use amount as total_amount if total_amount is null
UPDATE public.orders 
SET total_amount = amount 
WHERE total_amount IS NULL;

-- Update existing records to use pix_txid as transaction_id if transaction_id is null
UPDATE public.orders 
SET transaction_id = pix_txid 
WHERE transaction_id IS NULL;

-- Make total_amount NOT NULL after updating existing records
ALTER TABLE public.orders 
ALTER COLUMN total_amount SET NOT NULL;