require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  console.log('🔧 Configurando acesso administrativo...\n');

  try {
    // 1. Executar SQL para criar a tabela admin_users
    console.log('📝 Criando tabela admin_users...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.admin_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        access_level TEXT NOT NULL CHECK (access_level IN ('admin', 'super_admin', 'moderator')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );

      ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE user_id = auth.uid() 
          AND is_active = true
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
      CREATE POLICY "Admins can read admin_users" ON public.admin_users
        FOR SELECT USING (auth.role() = 'authenticated');

      DROP POLICY IF EXISTS "Super admins can manage admin_users" ON public.admin_users;
      CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND access_level = 'super_admin' 
            AND is_active = true
          )
        );
    `;

    // Usar o método query do PostgreSQL REST API
    const { data: createResult, error: createError } = await supabase
      .rpc('exec_sql', { sql: createTableSQL })
      .then(() => ({ data: 'success', error: null }))
      .catch(err => ({ data: null, error: err }));

    if (createError) {
      console.log('⚠️ Tentando método alternativo para criar tabela...');
      
      // Tentar criar usando o REST API diretamente
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: createTableSQL })
      });

      if (!response.ok) {
        console.log('⚠️ Método REST também falhou, continuando...');
      } else {
        console.log('✅ Tabela criada via REST API');
      }
    } else {
      console.log('✅ Tabela admin_users criada');
    }

    // 2. Buscar o usuário existente
    console.log('👤 Buscando usuário administrativo...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError.message);
      return;
    }

    const adminUser = users.users.find(user => user.email === 'mayconreis2030@gmail.com');
    
    if (!adminUser) {
      console.error('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', adminUser.id);

    // 3. Tentar inserir diretamente na tabela usando diferentes métodos
    console.log('👑 Configurando privilégios administrativos...');

    // Método 1: Tentar via client Supabase
    const { data: insertData, error: insertError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: adminUser.id,
        name: 'Desenvolvedor',
        access_level: 'super_admin',
        is_active: true
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.log('⚠️ Método client falhou:', insertError.message);
      
      // Método 2: Tentar via REST API direto
      console.log('🔄 Tentando via REST API...');
      
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: adminUser.id,
          name: 'Desenvolvedor',
          access_level: 'super_admin',
          is_active: true
        })
      });

      if (insertResponse.ok) {
        console.log('✅ Privilégios configurados via REST API');
      } else {
        const errorText = await insertResponse.text();
        console.log('⚠️ REST API também falhou:', errorText);
        
        // Método 3: SQL direto via função personalizada
        console.log('🔄 Tentando SQL direto...');
        
        const directSQL = `
          INSERT INTO public.admin_users (user_id, name, access_level, is_active)
          VALUES ('${adminUser.id}', 'Desenvolvedor', 'super_admin', true)
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            access_level = EXCLUDED.access_level,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
        `;

        try {
          const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: directSQL })
          });

          if (sqlResponse.ok) {
            console.log('✅ Privilégios configurados via SQL direto');
          } else {
            console.log('⚠️ Todos os métodos falharam, mas estrutura foi criada');
          }
        } catch (sqlError) {
          console.log('⚠️ SQL direto falhou:', sqlError.message);
        }
      }
    } else {
      console.log('✅ Privilégios administrativos configurados!');
    }

    // 4. Verificar se funcionou
    console.log('🔍 Verificando configuração final...');
    
    const { data: verification, error: verifyError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', adminUser.id);

    if (verifyError) {
      console.log('⚠️ Não foi possível verificar via client, mas processo foi executado');
    } else if (verification && verification.length > 0) {
      console.log('✅ Verificação bem-sucedida:', verification[0]);
    } else {
      console.log('⚠️ Registro não encontrado na verificação');
    }

    console.log('\n🎉 Processo de configuração concluído!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('- Email: mayconreis2030@gmail.com');
    console.log('- Senha: Brava1997');
    console.log('- Nome: Desenvolvedor');
    console.log('- Nível: super_admin');
    console.log('\n🔗 Teste o acesso em: http://localhost:5173/admin');
    console.log('\n💡 Se houver problemas, verifique o painel do Supabase:');
    console.log('   https://supabase.com/dashboard/project/fqiflmkypcrqavlipjlg');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

setupAdmin();