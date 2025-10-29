-- Script completo para configurar o banco de dados CrevinTickets
-- Execute este script no SQL Editor do Supabase Dashboard

-- =====================================================
-- 1. CRIAR TABELAS PRINCIPAIS
-- =====================================================

-- Create events table
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

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
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

-- Add missing columns to orders table if they don't exist
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

-- Create payment_proofs table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'admin' CHECK (access_level IN ('admin', 'super_admin', 'moderator')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add missing columns to admin_users table if they don't exist
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'admin' CHECK (access_level IN ('admin', 'super_admin', 'moderator')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CRIAR FUNÇÕES AUXILIARES
-- =====================================================

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin access level
CREATE OR REPLACE FUNCTION public.get_admin_access_level(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_access_level TEXT;
BEGIN
  SELECT au.access_level INTO user_access_level
  FROM public.admin_users au
  WHERE au.user_id = user_uuid 
  AND au.is_active = true;
  
  RETURN COALESCE(user_access_level, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CRIAR POLÍTICAS DE SEGURANÇA (RLS POLICIES)
-- =====================================================

-- EVENTS POLICIES
DROP POLICY IF EXISTS "Events are publicly readable" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
DROP POLICY IF EXISTS "Admin users can insert events" ON public.events;
DROP POLICY IF EXISTS "Admin users can update events" ON public.events;
DROP POLICY IF EXISTS "Admin users can delete events" ON public.events;

CREATE POLICY "Events are publicly readable"
ON public.events FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin users can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin users can update events"
ON public.events FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin users can delete events"
ON public.events FOR DELETE
TO authenticated
USING (public.is_admin());

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Orders are publicly readable" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin users can update orders" ON public.orders;

CREATE POLICY "Orders are publicly readable"
ON public.orders FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admin users can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin());

-- PAYMENT PROOFS POLICIES
DROP POLICY IF EXISTS "Payment proofs are publicly readable" ON public.payment_proofs;
DROP POLICY IF EXISTS "Anyone can create payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Authenticated users can delete payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Admin users can delete payment proofs" ON public.payment_proofs;

CREATE POLICY "Payment proofs are publicly readable"
ON public.payment_proofs FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can create payment proofs"
ON public.payment_proofs FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admin users can delete payment proofs"
ON public.payment_proofs FOR DELETE
TO authenticated
USING (public.is_admin());

-- ADMIN USERS POLICIES
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admin can delete admin_users" ON public.admin_users;

CREATE POLICY "Authenticated users can read admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admin can insert admin_users"
ON public.admin_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND access_level = 'super_admin' 
    AND is_active = true
  )
);

CREATE POLICY "Super admin can update admin_users"
ON public.admin_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND access_level = 'super_admin' 
    AND is_active = true
  )
);

CREATE POLICY "Super admin can delete admin_users"
ON public.admin_users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND access_level = 'super_admin' 
    AND is_active = true
  )
);

-- =====================================================
-- 5. CRIAR TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. CONFIGURAR STORAGE BUCKET
-- =====================================================

-- Create storage bucket for payment proofs (execute manually if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Payment proofs are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete payment proofs from storage" ON storage.objects;

CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Payment proofs are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Admin users can delete payment proofs from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- =====================================================
-- 7. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir evento de exemplo se não existir
INSERT INTO public.events (title, description, date, location, price, capacity, image_url)
SELECT 
  'Show de Rock - Banda XYZ',
  'Um incrível show de rock com a banda XYZ. Prepare-se para uma noite inesquecível!',
  NOW() + INTERVAL '30 days',
  'Arena Crevin - São Paulo, SP',
  50.00,
  1000,
  '/images/rock-show.svg'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Show de Rock - Banda XYZ');

INSERT INTO public.events (title, description, date, location, price, capacity, image_url)
SELECT 
  'Festival Eletrônico 2025',
  'O maior festival de música eletrônica do ano com os melhores DJs internacionais.',
  NOW() + INTERVAL '45 days',
  'Parque Ibirapuera - São Paulo, SP',
  120.00,
  5000,
  '/images/electronic-festival.svg'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Festival Eletrônico 2025');

INSERT INTO public.events (title, description, date, location, price, capacity, image_url)
SELECT 
  'Stand-up Comedy Night',
  'Uma noite de muito humor com os melhores comediantes do Brasil.',
  NOW() + INTERVAL '15 days',
  'Teatro Municipal - Rio de Janeiro, RJ',
  35.00,
  300,
  '/images/comedy-show.svg'
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Stand-up Comedy Night');

-- =====================================================
-- SCRIPT CONCLUÍDO
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