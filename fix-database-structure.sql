-- Script para corrigir estrutura do banco de dados
-- Execute este script PRIMEIRO se houver erros de colunas não existentes

-- =====================================================
-- 1. GARANTIR QUE AS TABELAS BÁSICAS EXISTAM
-- =====================================================

-- Create events table (basic structure)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  capacity INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table (basic structure)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount NUMERIC(10, 2) NOT NULL,
  pix_txid TEXT NOT NULL,
  pix_payload TEXT NOT NULL,
  pix_qr_dataurl TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  confirmed_presence BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_proofs table (basic structure)
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table (basic structure)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ADICIONAR COLUNAS QUE PODEM ESTAR FALTANDO
-- =====================================================

-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Add missing columns to admin_users table
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 3. ADICIONAR CONSTRAINTS E FOREIGN KEYS
-- =====================================================

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for orders.event_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_event_id_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for payment_proofs.order_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_proofs_order_id_fkey' 
        AND table_name = 'payment_proofs'
    ) THEN
        ALTER TABLE public.payment_proofs 
        ADD CONSTRAINT payment_proofs_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for admin_users.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_users_user_id_fkey' 
        AND table_name = 'admin_users'
    ) THEN
        ALTER TABLE public.admin_users 
        ADD CONSTRAINT admin_users_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add unique constraint for admin_users.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_users_user_id_key' 
        AND table_name = 'admin_users'
    ) THEN
        ALTER TABLE public.admin_users 
        ADD CONSTRAINT admin_users_user_id_key UNIQUE(user_id);
    END IF;
END $$;

-- =====================================================
-- 4. ADICIONAR CHECK CONSTRAINTS
-- =====================================================

-- Add check constraint for admin_users.access_level if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'admin_users_access_level_check'
    ) THEN
        ALTER TABLE public.admin_users 
        ADD CONSTRAINT admin_users_access_level_check 
        CHECK (access_level IN ('admin', 'super_admin', 'moderator'));
    END IF;
END $$;

-- =====================================================
-- 5. POPULAR COLUNAS VAZIAS
-- =====================================================

-- Update existing records to populate new columns
UPDATE public.orders 
SET total_amount = amount 
WHERE total_amount IS NULL;

UPDATE public.orders 
SET transaction_id = pix_txid 
WHERE transaction_id IS NULL;

-- Make total_amount NOT NULL after updating existing records
ALTER TABLE public.orders 
ALTER COLUMN total_amount SET NOT NULL;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'orders', 'payment_proofs', 'admin_users')
ORDER BY tablename;

-- Verificar colunas das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'orders', 'payment_proofs', 'admin_users')
ORDER BY table_name, ordinal_position;