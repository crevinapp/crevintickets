require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdminTable() {
  console.log('🔍 Verificando estrutura da tabela admin_users...\n');

  try {
    // Verificar se a tabela existe e suas colunas
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Tabela admin_users não existe');
      } else {
        console.log('📋 Estrutura da tabela admin_users:');
        console.log('Erro:', error.message);
      }
    } else {
      console.log('✅ Tabela admin_users existe');
      
      // Tentar obter informações sobre as colunas
      const { data: tableInfo, error: infoError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admin_users' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });

      if (infoError) {
        console.log('❌ Erro ao obter informações das colunas:', infoError.message);
        
        // Tentar uma abordagem alternativa
        console.log('\n🔍 Tentando verificar dados existentes...');
        const { data: existingData, error: dataError } = await supabase
          .from('admin_users')
          .select('*');
          
        if (dataError) {
          console.log('❌ Erro ao verificar dados:', dataError.message);
        } else {
          console.log('📊 Dados existentes na tabela:', existingData);
        }
      } else {
        console.log('📋 Colunas da tabela admin_users:');
        tableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

checkAdminTable();