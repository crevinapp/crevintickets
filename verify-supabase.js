import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Verificando configuração do Supabase...\n');

// Verifica se as variáveis estão definidas
console.log('📋 Variáveis de ambiente:');
console.log(`- VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Definida' : '❌ Não definida'}`);
console.log(`- VITE_SUPABASE_PUBLISHABLE_KEY: ${supabaseKey ? '✅ Definida' : '❌ Não definida'}`);
console.log(`- VITE_SUPABASE_PROJECT_ID: ${process.env.VITE_SUPABASE_PROJECT_ID ? '✅ Definida' : '❌ Não definida'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente não configuradas corretamente!');
  process.exit(1);
}

// Cria cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSupabase() {
  try {
    console.log('🔗 Testando conexão com Supabase...');
    
    // Testa conexão básica
    const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!\n');
    
    // Verifica tabelas
    console.log('📊 Verificando tabelas...');
    
    const tabelas = ['events', 'orders', 'payment_proofs'];
    
    for (const tabela of tabelas) {
      try {
        const { data, error, count } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Tabela '${tabela}': ${error.message}`);
        } else {
          console.log(`✅ Tabela '${tabela}': ${count || 0} registros`);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela '${tabela}': ${err.message}`);
      }
    }
    
    console.log('\n🎯 Testando inserção de dados...');
    
    // Testa inserção de evento de teste
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Evento de Teste - Verificação',
        description: 'Este é um evento de teste para verificar a funcionalidade',
        date: new Date().toISOString(),
        location: 'Local de Teste',
        price: 50.00,
        capacity: 100,
        image_url: 'https://via.placeholder.com/400x300'
      })
      .select()
      .single();
    
    if (eventError) {
      console.log('❌ Erro ao inserir evento de teste:', eventError.message);
    } else {
      console.log('✅ Evento de teste inserido com sucesso!');
      console.log(`   ID: ${eventData.id}`);
      
      // Remove o evento de teste
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventData.id);
      
      if (deleteError) {
        console.log('⚠️ Aviso: Não foi possível remover o evento de teste');
      } else {
        console.log('✅ Evento de teste removido com sucesso');
      }
    }
    
    console.log('\n🎉 Verificação do Supabase concluída!');
    return true;
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    return false;
  }
}

verificarSupabase();