# 🗄️ Instruções para Configuração do Banco de Dados

Este documento contém instruções para verificar e corrigir a estrutura do banco de dados do CrevinTickets.

## 📋 Estrutura Esperada do Banco

O sistema precisa das seguintes tabelas:

### 1. **events** - Eventos
- `id` (UUID, chave primária)
- `title` (TEXT, nome do evento)
- `description` (TEXT, descrição)
- `date` (TIMESTAMPTZ, data e hora)
- `location` (TEXT, local)
- `price` (NUMERIC, preço)
- `capacity` (INTEGER, capacidade)
- `image_url` (TEXT, URL da imagem)
- `created_at` (TIMESTAMPTZ, data de criação)

### 2. **orders** - Pedidos
- `id` (UUID, chave primária)
- `event_id` (UUID, referência ao evento)
- `buyer_name` (TEXT, nome do comprador)
- `buyer_email` (TEXT, email do comprador)
- `quantity` (INTEGER, quantidade)
- `amount` (NUMERIC, valor)
- `total_amount` (NUMERIC, valor total)
- `pix_txid` (TEXT, ID da transação PIX)
- `transaction_id` (TEXT, ID da transação)
- `pix_payload` (TEXT, payload PIX)
- `pix_qr_dataurl` (TEXT, QR code)
- `status` (TEXT, status: pending/paid/cancelled)
- `confirmed_presence` (BOOLEAN, presença confirmada)
- `created_at` (TIMESTAMPTZ, data de criação)

### 3. **payment_proofs** - Comprovantes de Pagamento
- `id` (UUID, chave primária)
- `order_id` (UUID, referência ao pedido)
- `file_url` (TEXT, URL do arquivo)
- `note` (TEXT, observações)
- `created_at` (TIMESTAMPTZ, data de criação)

### 4. **admin_users** - Usuários Administradores
- `id` (UUID, chave primária)
- `user_id` (UUID, referência ao auth.users)
- `name` (TEXT, nome)
- `access_level` (TEXT, nível de acesso)
- `is_active` (BOOLEAN, ativo)
- `created_at` (TIMESTAMPTZ, data de criação)
- `updated_at` (TIMESTAMPTZ, data de atualização)

### 5. **Storage Bucket**
- `payment-proofs` - Para armazenar comprovantes de pagamento

## 🔧 Como Corrigir o Banco de Dados

### Opção 1: Script SQL Completo (Recomendado)

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá para **SQL Editor**
3. Abra o arquivo `setup-database-complete.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** para executar

Este script irá:
- ✅ Criar todas as tabelas necessárias
- ✅ Configurar Row Level Security (RLS)
- ✅ Criar funções auxiliares
- ✅ Configurar políticas de segurança
- ✅ Criar triggers
- ✅ Configurar storage bucket
- ✅ Inserir dados de exemplo (opcional)

### Opção 2: Verificação Automática (Avançado)

Se você tem acesso à Service Key do Supabase:

1. Edite o arquivo `check-and-fix-database.js`
2. Substitua `SUPABASE_SERVICE_KEY` pela sua chave de serviço
3. Execute: `node check-and-fix-database.js`

## 🔍 Como Verificar se Está Funcionando

Após executar o script, você pode verificar se tudo está correto:

### 1. Verificar Tabelas
```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'orders', 'payment_proofs', 'admin_users')
ORDER BY tablename;
```

### 2. Verificar Dados de Exemplo
```sql
SELECT title, date, location, price FROM public.events;
```

### 3. Verificar Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'payment-proofs';
```

## 🚨 Problemas Comuns

### Erro: "relation does not exist"
- **Causa**: Tabela não foi criada
- **Solução**: Execute o script `setup-database-complete.sql`

### Erro: "permission denied"
- **Causa**: Políticas RLS não configuradas
- **Solução**: Execute a seção de políticas do script

### Erro: "bucket does not exist"
- **Causa**: Bucket de storage não foi criado
- **Solução**: Execute manualmente no SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;
```

## 📝 Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```env
VITE_SUPABASE_URL="https://fqiflmkypcrqavlipjlg.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_publica_aqui"
```

## ✅ Checklist Final

- [ ] Todas as 4 tabelas foram criadas
- [ ] RLS está habilitado em todas as tabelas
- [ ] Políticas de segurança estão configuradas
- [ ] Funções auxiliares foram criadas
- [ ] Storage bucket foi criado
- [ ] Dados de exemplo foram inseridos
- [ ] Aplicação consegue conectar ao banco
- [ ] Funcionalidades básicas estão funcionando

## 🆘 Suporte

Se ainda houver problemas:

1. Verifique os logs do Supabase Dashboard
2. Teste a conexão com o banco através da aplicação
3. Verifique se as variáveis de ambiente estão corretas
4. Execute novamente o script completo

---

**Nota**: Este script é seguro para executar múltiplas vezes, pois usa `CREATE TABLE IF NOT EXISTS` e `ON CONFLICT DO NOTHING`.