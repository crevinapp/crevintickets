import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🔧 Configurando banco de dados...');

    // 1. Criar tabela events
    console.log('📋 Criando tabela events...');
    const { error: eventsError } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (eventsError) {
      console.log('⚠️ Tentando método alternativo para events...');
      // Método alternativo usando query direta
      const { error: altError } = await supabase
        .from('events')
        .select('*')
        .limit(1);
      
      if (altError && altError.code === 'PGRST116') {
        console.log('❌ Tabela events não existe, precisa ser criada manualmente');
      } else {
        console.log('✅ Tabela events já existe');
      }
    } else {
      console.log('✅ Tabela events criada/verificada');
    }

    // 2. Criar tabela orders
    console.log('📋 Criando tabela orders...');
    const { error: ordersError } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (ordersError) {
      console.log('⚠️ Tentando método alternativo para orders...');
      const { error: altError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
      
      if (altError && altError.code === 'PGRST116') {
        console.log('❌ Tabela orders não existe, precisa ser criada manualmente');
      } else {
        console.log('✅ Tabela orders já existe');
      }
    } else {
      console.log('✅ Tabela orders criada/verificada');
    }

    // 3. Criar tabela payment_proofs
    console.log('📋 Criando tabela payment_proofs...');
    const { error: proofsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.payment_proofs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          file_url TEXT NOT NULL,
          note TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (proofsError) {
      console.log('⚠️ Tentando método alternativo para payment_proofs...');
      const { error: altError } = await supabase
        .from('payment_proofs')
        .select('*')
        .limit(1);
      
      if (altError && altError.code === 'PGRST116') {
        console.log('❌ Tabela payment_proofs não existe, precisa ser criada manualmente');
      } else {
        console.log('✅ Tabela payment_proofs já existe');
      }
    } else {
      console.log('✅ Tabela payment_proofs criada/verificada');
    }

    // 4. Verificar tabelas existentes
    console.log('\n📊 Verificando tabelas existentes...');
    
    // Testar cada tabela
    const tables = ['events', 'orders', 'payment_proofs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: Acessível (${data?.length || 0} registros encontrados)`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: Erro - ${err.message}`);
      }
    }

    // 5. Testar inserção de evento de exemplo
    console.log('\n🎯 Testando inserção de evento...');
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

    console.log('\n🎉 Verificação do banco de dados concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

setupDatabase();