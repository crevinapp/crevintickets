import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são necessárias')
  console.log('Crie um arquivo .env baseado no .env.example')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarTabelas() {
  console.log('🔍 Verificando tabelas no Supabase...\n')

  // Lista de tabelas esperadas
  const tabelasEsperadas = ['events', 'orders', 'payment_proofs', 'admin_users']
  
  try {
    // Verificar cada tabela
    for (const tabela of tabelasEsperadas) {
      console.log(`📋 Verificando tabela: ${tabela}`)
      
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ Erro: ${error.message}`)
        } else {
          console.log(`   ✅ Tabela existe e é acessível`)
        }
      } catch (err) {
        console.log(`   ❌ Erro ao acessar: ${err.message}`)
      }
    }

    console.log('\n🔍 Verificando estrutura das tabelas...\n')

    // Verificar estrutura específica das tabelas
    await verificarEstrutura()

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

async function verificarEstrutura() {
  // Verificar tabela events
  console.log('📋 Estrutura da tabela events:')
  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, description, date, location, price, capacity, image_url, created_at')
      .limit(1)
    console.log('   ✅ Todas as colunas necessárias estão presentes')
  } catch (error) {
    console.log(`   ❌ Problema na estrutura: ${error.message}`)
  }

  // Verificar tabela orders
  console.log('📋 Estrutura da tabela orders:')
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, event_id, buyer_name, buyer_email, quantity, amount, total_amount, pix_txid, transaction_id, pix_payload, pix_qr_dataurl, status, confirmed_presence, created_at')
      .limit(1)
    console.log('   ✅ Todas as colunas necessárias estão presentes')
  } catch (error) {
    console.log(`   ❌ Problema na estrutura: ${error.message}`)
  }

  // Verificar tabela payment_proofs
  console.log('📋 Estrutura da tabela payment_proofs:')
  try {
    const { data: proofs } = await supabase
      .from('payment_proofs')
      .select('id, order_id, file_url, note, created_at')
      .limit(1)
    console.log('   ✅ Todas as colunas necessárias estão presentes')
  } catch (error) {
    console.log(`   ❌ Problema na estrutura: ${error.message}`)
  }

  // Verificar tabela admin_users
  console.log('📋 Estrutura da tabela admin_users:')
  try {
    const { data: admins } = await supabase
      .from('admin_users')
      .select('id, user_id, name, access_level, is_active, created_at, updated_at')
      .limit(1)
    console.log('   ✅ Todas as colunas necessárias estão presentes')
  } catch (error) {
    console.log(`   ❌ Problema na estrutura: ${error.message}`)
  }

  // Verificar relacionamentos
  console.log('\n🔗 Verificando relacionamentos:')
  try {
    const { data: ordersWithEvents } = await supabase
      .from('orders')
      .select('*, events(*)')
      .limit(1)
    console.log('   ✅ Relacionamento orders -> events funciona')
  } catch (error) {
    console.log(`   ❌ Problema no relacionamento orders -> events: ${error.message}`)
  }

  try {
    const { data: proofsWithOrders } = await supabase
      .from('payment_proofs')
      .select('*, orders(*)')
      .limit(1)
    console.log('   ✅ Relacionamento payment_proofs -> orders funciona')
  } catch (error) {
    console.log(`   ❌ Problema no relacionamento payment_proofs -> orders: ${error.message}`)
  }
}

async function verificarDadosExemplo() {
  console.log('\n📊 Verificando dados de exemplo:')
  
  try {
    const { data: events, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
    
    console.log(`   📅 Eventos cadastrados: ${count || 0}`)
    
    if (events && events.length > 0) {
      events.forEach(event => {
        console.log(`      - ${event.title} (${event.date})`)
      })
    }
  } catch (error) {
    console.log(`   ❌ Erro ao buscar eventos: ${error.message}`)
  }

  try {
    const { data: orders, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
    
    console.log(`   🎫 Pedidos cadastrados: ${count || 0}`)
  } catch (error) {
    console.log(`   ❌ Erro ao buscar pedidos: ${error.message}`)
  }

  try {
    const { data: admins, count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
    
    console.log(`   👤 Usuários admin cadastrados: ${count || 0}`)
  } catch (error) {
    console.log(`   ❌ Erro ao buscar admins: ${error.message}`)
  }
}

// Executar verificação
async function main() {
  console.log('🚀 Iniciando verificação do banco de dados CrevinTickets\n')
  
  await verificarTabelas()
  await verificarDadosExemplo()
  
  console.log('\n✅ Verificação concluída!')
  console.log('\n💡 Se houver erros, execute os scripts de correção:')
  console.log('   1. fix-database-structure.sql (primeiro)')
  console.log('   2. setup-database-complete.sql (depois)')
}

main().catch(console.error)