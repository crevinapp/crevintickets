-- =====================================================
-- SCRIPT COMPLETO PARA CONFIGURAÇÃO DO BANCO DE DADOS
-- Sistema de Venda de Ingressos - CrevinTickets
-- =====================================================

-- 1. CRIAR TABELA DE EVENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security para events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para events
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. CRIAR TABELA DE PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  pix_txid TEXT NOT NULL,
  pix_payload TEXT NOT NULL,
  pix_qr_dataurl TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  confirmed_presence BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security para orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para orders
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "orders_delete_policy" ON public.orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. CRIAR TABELA DE COMPROVANTES DE PAGAMENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security para payment_proofs
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para payment_proofs
CREATE POLICY "payment_proofs_select_policy" ON public.payment_proofs
  FOR SELECT USING (true);

CREATE POLICY "payment_proofs_insert_policy" ON public.payment_proofs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "payment_proofs_update_policy" ON public.payment_proofs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "payment_proofs_delete_policy" ON public.payment_proofs
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. CRIAR TABELA DE USUÁRIOS ADMINISTRATIVOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar Row Level Security para admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para admin_users
CREATE POLICY "admin_users_select_policy" ON public.admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_users_insert_policy" ON public.admin_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_users_update_policy" ON public.admin_users
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "admin_users_delete_policy" ON public.admin_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para events
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Índices para payment_proofs
CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_id ON public.payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_created_at ON public.payment_proofs(created_at);

-- Índices para admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- =====================================================
-- 6. CONFIGURAR STORAGE BUCKET PARA COMPROVANTES
-- =====================================================

-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload de arquivos (qualquer um pode fazer upload)
CREATE POLICY "payment_proofs_upload_policy" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

-- Política para acesso público aos arquivos
CREATE POLICY "payment_proofs_public_access_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

-- Política para exclusão (apenas usuários autenticados)
CREATE POLICY "payment_proofs_delete_files_policy" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- =====================================================
-- 7. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir evento de exemplo
INSERT INTO public.events (title, description, date, location, price, capacity, image_url)
VALUES (
  'Show de Rock - Banda XYZ',
  'Um incrível show de rock com a famosa Banda XYZ. Prepare-se para uma noite inesquecível com os maiores sucessos da banda!',
  '2024-12-15 20:00:00+00',
  'Arena Central - São Paulo, SP',
  85.00,
  500,
  'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Show+de+Rock'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.events (title, description, date, location, price, capacity, image_url)
VALUES (
  'Festival de Música Eletrônica',
  'O maior festival de música eletrônica da região! Com DJs internacionais e uma produção de primeira qualidade.',
  '2024-12-20 22:00:00+00',
  'Clube Eletrônico - Rio de Janeiro, RJ',
  120.00,
  1000,
  'https://via.placeholder.com/400x300/6366f1/ffffff?text=Festival+Eletrônico'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.events (title, description, date, location, price, capacity, image_url)
VALUES (
  'Stand-up Comedy Night',
  'Uma noite de muito humor com os melhores comediantes do país. Risadas garantidas!',
  '2024-12-10 19:30:00+00',
  'Teatro do Humor - Belo Horizonte, MG',
  45.00,
  200,
  'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Stand-up+Comedy'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    RAISE NOTICE '✅ Tabela events criada com sucesso';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    RAISE NOTICE '✅ Tabela orders criada com sucesso';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_proofs') THEN
    RAISE NOTICE '✅ Tabela payment_proofs criada com sucesso';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
    RAISE NOTICE '✅ Tabela admin_users criada com sucesso';
  END IF;
END $$;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- INSTRUÇÕES PARA USO:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard
-- 2. Vá para seu projeto
-- 3. Clique em "SQL Editor" no menu lateral
-- 4. Cole este script completo
-- 5. Clique em "Run" para executar
-- 
-- RECURSOS CRIADOS:
-- ✅ Tabela events (eventos)
-- ✅ Tabela orders (pedidos)
-- ✅ Tabela payment_proofs (comprovantes)
-- ✅ Tabela admin_users (usuários admin)
-- ✅ Políticas RLS configuradas
-- ✅ Índices para performance
-- ✅ Bucket de storage configurado
-- ✅ Dados de exemplo inseridos
-- 
-- =====================================================