const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela events...');
    
    // Verificar se a coluna available_spots existe
    const { data, error } = await supabase
      .from('events')
      .select('id, title, capacity, available_spots')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao verificar tabela:', error.message);
      return;
    }
    
    console.log('✅ Tabela events encontrada');
    if (data && data.length > 0) {
      console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
    }
    
    // Verificar se há eventos sem available_spots definido
    const { data: eventsWithoutSpots, error: checkError } = await supabase
      .from('events')
      .select('id, title, capacity, available_spots')
      .is('available_spots', null);
    
    if (checkError) {
      console.log('❌ Erro ao verificar eventos:', checkError.message);
      return;
    }
    
    if (eventsWithoutSpots && eventsWithoutSpots.length > 0) {
      console.log(`⚠️  Encontrados ${eventsWithoutSpots.length} eventos sem available_spots definido`);
      console.log('📝 Eventos que precisam ser atualizados:');
      eventsWithoutSpots.forEach(event => {
        console.log(`   - ${event.title} (ID: ${event.id}, Capacity: ${event.capacity})`);
      });
      
      // Atualizar eventos sem available_spots
      console.log('🔄 Atualizando eventos...');
      for (const event of eventsWithoutSpots) {
        const { error: updateError } = await supabase
          .from('events')
          .update({ available_spots: event.capacity })
          .eq('id', event.id);
        
        if (updateError) {
          console.log(`❌ Erro ao atualizar evento ${event.title}:`, updateError.message);
        } else {
          console.log(`✅ Evento "${event.title}" atualizado com ${event.capacity} vagas disponíveis`);
        }
      }
    } else {
      console.log('✅ Todos os eventos têm available_spots definido');
    }
    
    // Mostrar status final
    const { data: allEvents, error: finalError } = await supabase
      .from('events')
      .select('id, title, capacity, available_spots')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ Erro ao buscar eventos finais:', finalError.message);
      return;
    }
    
    console.log('\n📊 Status atual dos eventos:');
    allEvents.forEach(event => {
      console.log(`   - ${event.title}: ${event.available_spots}/${event.capacity} vagas`);
    });
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

checkTableStructure();