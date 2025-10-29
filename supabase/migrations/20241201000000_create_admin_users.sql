-- Create admin_users table to store admin user information
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

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read admin_users
CREATE POLICY "Authenticated users can read admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (true);

-- Only super_admin can insert new admin users
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

-- Only super_admin can update admin users
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

-- Only super_admin can delete admin users
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
  access_level TEXT;
BEGIN
  SELECT admin_users.access_level INTO access_level
  FROM public.admin_users 
  WHERE user_id = user_uuid 
  AND is_active = true;
  
  RETURN COALESCE(access_level, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to use admin functions
-- Update events policies
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

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

-- Update orders policies
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

CREATE POLICY "Admin users can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Update payment_proofs policies
DROP POLICY IF EXISTS "Authenticated users can delete payment proofs" ON public.payment_proofs;

CREATE POLICY "Admin users can delete payment proofs"
ON public.payment_proofs FOR DELETE
TO authenticated
USING (public.is_admin());

-- Update storage policies
DROP POLICY IF EXISTS "Authenticated users can delete payment proofs" ON storage.objects;

CREATE POLICY "Admin users can delete payment proofs from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();