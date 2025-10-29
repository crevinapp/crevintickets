# Como Corrigir Erros do Banco de Dados

## Problema
Você está recebendo erros como:
- `ERROR: 42703: column "access_level" does not exist`
- `ERROR: 42703: column "total_amount" does not exist`

## Solução

### Passo 1: Execute o Script de Correção PRIMEIRO
Execute o arquivo `fix-database-structure.sql` no SQL Editor do Supabase Dashboard:

1. Abra o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo do arquivo `fix-database-structure.sql`
4. Execute o script

### Passo 2: Depois Execute o Script Completo
Após o Passo 1 ser executado com sucesso, execute o `setup-database-complete.sql`:

1. No SQL Editor do Supabase
2. Cole o conteúdo do arquivo `setup-database-complete.sql`
3. Execute o script

## Por que isso acontece?

O erro ocorre quando:
1. Você já tem tabelas criadas com estrutura antiga
2. O script tenta usar colunas que não existem ainda
3. As funções são criadas antes das colunas necessárias

## O que o script de correção faz?

1. **Cria tabelas básicas** se não existirem
2. **Adiciona colunas faltantes** usando `ADD COLUMN IF NOT EXISTS`
3. **Adiciona constraints** de forma segura
4. **Popula colunas vazias** com dados existentes
5. **Verifica a estrutura final**

## Verificação

Após executar ambos os scripts, você deve ver:

### Tabelas criadas:
- `events`
- `orders` 
- `payment_proofs`
- `admin_users`

### Colunas importantes:
- `orders.total_amount`
- `orders.transaction_id`
- `admin_users.access_level`
- `admin_users.is_active`
- `admin_users.updated_at`

## Se ainda houver erros

1. **Verifique se você tem permissões** de administrador no Supabase
2. **Execute os scripts um por vez** (não tudo de uma vez)
3. **Verifique se há dados conflitantes** nas tabelas existentes
4. **Entre em contato** se o problema persistir

## Comandos de Verificação

Após executar os scripts, você pode verificar se tudo está correto:

```sql
-- Verificar tabelas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verificar colunas da tabela orders
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public';

-- Verificar colunas da tabela admin_users
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'admin_users' AND table_schema = 'public';
```