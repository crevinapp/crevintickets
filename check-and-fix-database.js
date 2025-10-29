import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const SUPABASE_URL = "https://fqiflmkypcrqavlipjlg.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaWZsbWt5cGNycWF2bGlwamxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc0MjUwMSwiZXhwIjoyMDc3MzE4NTAxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"; // Você precisa fornecer a service key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndFixDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...');
  
  try {
    // Verificar se as tabelas principais existem
    const tables = ['events', 'orders', 'payment_proofs', 'admin_users'];
    
    for (const table of tables) {
      console.log(`Verificando tabela: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${table} não encontrada ou com erro:`, error.message);
        
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`🔧 Tentando criar tabela ${table}...`);
          await createMissingTable(table);
        }
      } else {
        console.log(`✅ Tabela ${table} existe e está acessível`);
      }
    }
    
    // Verificar se o bucket de storage existe
    console.log('Verificando bucket de storage...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Erro ao verificar buckets:', bucketError.message);
    } else {
      const paymentProofsBucket = buckets.find(bucket => bucket.id === 'payment-proofs');
      if (paymentProofsBucket) {
        console.log('✅ Bucket payment-proofs existe');
      } else {
        console.log('❌ Bucket payment-proofs não encontrado');
        await createPaymentProofsBucket();
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function createMissingTable(tableName) {
  const migrationFiles = [
    'supabase/migrations/20251029133834_cbddc86d-1a2d-4727-a786-f53f444e983d.sql',
    'supabase/migrations/20241201000000_create_admin_users.sql',
    'supabase/migrations/20241230000000_add_missing_columns_to_orders.sql'
  ];
  
  for (const migrationFile of migrationFiles) {
    if (fs.existsSync(migrationFile)) {
      console.log(`📄 Aplicando migração: ${migrationFile}`);
      const sql = fs.readFileSync(migrationFile, 'utf8');
      
      // Dividir o SQL em comandos individuais
      const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: command.trim() + ';' });
            if (error && !error.message.includes('already exists')) {
              console.log(`⚠️ Aviso ao executar comando: ${error.message}`);
            }
          } catch (err) {
            console.log(`⚠️ Erro ao executar comando: ${err.message}`);
          }
        }
      }
    }
  }
}

async function createPaymentProofsBucket() {
  console.log('🪣 Criando bucket payment-proofs...');
  
  const { data, error } = await supabase.storage.createBucket('payment-proofs', {
    public: true,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    fileSizeLimit: 10485760 // 10MB
  });
  
  if (error) {
    console.log('❌ Erro ao criar bucket:', error.message);
  } else {
    console.log('✅ Bucket payment-proofs criado com sucesso');
  }
}

// Executar verificação
checkAndFixDatabase()
  .then(() => {
    console.log('🎉 Verificação do banco de dados concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });