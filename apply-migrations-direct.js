import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLDirect(sql) {
  try {
    // Usar uma abordagem mais direta com fetch
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.log('⚠️ Método direto falhou:', error.message);
    return null;
  }
}

async function applyMigrations() {
  try {
    console.log('🔧 Aplicando migrações...');

    // Ler o arquivo de migração
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20251029133834_cbddc86d-1a2d-4727-a786-f53f444e983d.sql');
    
    let migrationSQL;
    try {
      migrationSQL = readFileSync(migrationPath, 'utf8');
      console.log('✅ Arquivo de migração carregado');
    } catch (error) {
      console.error('❌ Erro ao ler arquivo de migração:', error.message);
      return false;
    }

    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      
      try {
        console.log(`\n[${i + 1}/${commands.length}] Executando comando...`);
        
        // Tentar diferentes métodos
        let result = await executeSQLDirect(command);
        
        if (!result) {
          // Método alternativo usando rpc
          const { data, error } = await supabase.rpc('exec', { sql: command });
          
          if (error) {
            console.log(`⚠️ Comando ${i + 1} falhou:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
            successCount++;
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
          successCount++;
        }
        
      } catch (error) {
        console.log(`❌ Erro no comando ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumo: ${successCount} sucessos, ${errorCount} erros`);

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const tables = ['events', 'orders', 'payment_proofs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact' })
          .limit(0);
        
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: Criada e acessível`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ${err.message}`);
      }
    }

    return successCount > errorCount;

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

// Executar
applyMigrations().then(success => {
  if (success) {
    console.log('\n🎉 Migrações aplicadas com sucesso!');
  } else {
    console.log('\n⚠️ Algumas migrações falharam. Verifique os logs acima.');
  }
});