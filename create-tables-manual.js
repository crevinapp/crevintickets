import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTablesManually() {
  console.log('🔧 Criando tabelas manualmente...');
  
  // Primeiro, vamos verificar se as tabelas já existem
  console.log('\n📋 Verificando tabelas existentes...');
  
  const tables = ['events', 'orders', 'payment_proofs'];
  const existingTables = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
        console.log(`✅ Tabela ${table}: Já existe`);
      } else {
        console.log(`❌ Tabela ${table}: Não encontrada (${error.code})`);
      }
    } catch (err) {
      console.log(`❌ Tabela ${table}: Erro - ${err.message}`);
    }
  }

  if (existingTables.length === tables.length) {
    console.log('\n🎉 Todas as tabelas já existem!');
    
    // Testar inserção
    console.log('\n🧪 Testando funcionalidade...');
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: 'Evento de Teste',
          description: 'Descrição do evento de teste',
          date: new Date().toISOString(),
          location: 'Local de Teste',
          price: 50.00,
          capacity: 100
        })
        .select()
        .single();

      if (error) {
        console.log('❌ Erro ao inserir evento:', error.message);
      } else {
        console.log('✅ Evento inserido com sucesso:', data.id);
        
        // Remover o evento de teste
        await supabase
          .from('events')
          .delete()
          .eq('id', data.id);
        console.log('🗑️ Evento de teste removido');
      }
    } catch (err) {
      console.log('❌ Erro no teste:', err.message);
    }
    
    return true;
  }

  console.log('\n⚠️ Algumas tabelas não existem. Você precisa criá-las manualmente no painel do Supabase.');
  console.log('\n📝 SQL para criar as tabelas:');
  
  console.log('\n-- Tabela events:');
  console.log(`
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

-- Habilitar RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (true);

-- Política para inserção (apenas usuários autenticados)
CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização (apenas usuários autenticados)
CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para exclusão (apenas usuários autenticados)
CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE USING (auth.role() = 'authenticated');
`);

  console.log('\n-- Tabela orders:');
  console.log(`
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

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (true);

-- Política para inserção (qualquer um pode criar pedidos)
CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Política para atualização (apenas usuários autenticados)
CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');
`);

  console.log('\n-- Tabela payment_proofs:');
  console.log(`
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "payment_proofs_select_policy" ON public.payment_proofs
  FOR SELECT USING (true);

-- Política para inserção (qualquer um pode criar comprovantes)
CREATE POLICY "payment_proofs_insert_policy" ON public.payment_proofs
  FOR INSERT WITH CHECK (true);

-- Política para exclusão (apenas usuários autenticados)
CREATE POLICY "payment_proofs_delete_policy" ON public.payment_proofs
  FOR DELETE USING (auth.role() = 'authenticated');
`);

  console.log('\n🔗 Para aplicar essas migrações:');
  console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
  console.log('2. Vá para seu projeto');
  console.log('3. Clique em "SQL Editor" no menu lateral');
  console.log('4. Cole e execute cada bloco SQL acima');
  console.log('5. Execute este script novamente para verificar');

  return false;
}

createTablesManually().then(success => {
  if (success) {
    console.log('\n🎉 Banco de dados configurado e funcionando!');
  } else {
    console.log('\n⚠️ Configuração manual necessária. Siga as instruções acima.');
  }
});