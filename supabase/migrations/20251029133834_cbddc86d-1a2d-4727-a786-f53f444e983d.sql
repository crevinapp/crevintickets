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

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events are publicly readable
CREATE POLICY "Events are publicly readable"
ON public.events FOR SELECT
TO public
USING (true);

-- Only authenticated users can manage events
CREATE POLICY "Authenticated users can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON public.events FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete events"
ON public.events FOR DELETE
TO authenticated
USING (true);

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

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders are publicly readable (for buyer to check status)
CREATE POLICY "Orders are publicly readable"
ON public.orders FOR SELECT
TO public
USING (true);

-- Anyone can create orders
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated users can update orders
CREATE POLICY "Authenticated users can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (true);

-- Create payment_proofs table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on payment_proofs
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Payment proofs are publicly readable
CREATE POLICY "Payment proofs are publicly readable"
ON public.payment_proofs FOR SELECT
TO public
USING (true);

-- Anyone can create payment proofs
CREATE POLICY "Anyone can create payment proofs"
ON public.payment_proofs FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated users can delete payment proofs
CREATE POLICY "Authenticated users can delete payment proofs"
ON public.payment_proofs FOR DELETE
TO authenticated
USING (true);

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Payment proofs are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs');