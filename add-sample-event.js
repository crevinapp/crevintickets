import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Verificando variáveis de ambiente...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Definida' : 'Não definida');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    process.exit(1);
}

// Cria cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleEvent() {
    try {
        console.log('📝 Tentando adicionar evento de exemplo...');
        
        const eventData = {
            title: 'Workshop de Nutrição Esportiva',
            description: 'Aprenda sobre nutrição para atletas e praticantes de atividade física.',
            date: '2024-12-15T10:00:00',
            location: 'Centro de Convenções - São Paulo',
            price: 150.00,
            capacity: 50,
            image_url: '/images/default-event.svg'
        };

        const { data, error } = await supabase
            .from('events')
            .insert([eventData])
            .select();

        if (error) {
            console.error('❌ Erro ao inserir evento:', error.message);
            if (error.message.includes('RLS')) {
                console.log('ℹ️  Erro de RLS é esperado - indica que a segurança está funcionando');
                console.log('ℹ️  Para inserir dados, seria necessário autenticação de usuário');
            }
        } else {
            console.log('✅ Evento adicionado com sucesso:', data);
        }

    } catch (err) {
        console.error('❌ Erro geral:', err.message);
    }
}

async function checkTables() {
    try {
        console.log('\n📊 Verificando tabelas...');
        
        // Verifica eventos
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .limit(5);

        if (eventsError) {
            console.error('❌ Erro ao consultar eventos:', eventsError.message);
        } else {
            console.log(`📅 Eventos encontrados: ${events.length}`);
            if (events.length > 0) {
                console.log('Primeiro evento:', events[0]);
            }
        }

        // Verifica pedidos
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .limit(5);

        if (ordersError) {
            console.error('❌ Erro ao consultar pedidos:', ordersError.message);
        } else {
            console.log(`🛒 Pedidos encontrados: ${orders.length}`);
        }

    } catch (err) {
        console.error('❌ Erro ao verificar tabelas:', err.message);
    }
}

async function main() {
    console.log('🚀 Iniciando verificação do Supabase...\n');
    
    await checkTables();
    await addSampleEvent();
    
    console.log('\n✅ Verificação concluída!');
}

main().catch(console.error);