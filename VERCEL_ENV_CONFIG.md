# 🔧 Configuração das Variáveis de Ambiente no Vercel

## ⚠️ IMPORTANTE: Configuração Correta para Deploy

### 📋 Variáveis que devem ser configuradas no Vercel Dashboard:

1. **Acesse**: https://vercel.com/dashboard
2. **Selecione**: Projeto `crevin-pix-tickets` 
3. **Vá em**: Settings > Environment Variables
4. **Configure as seguintes variáveis**:

---

### ✅ **Variável 1:**
- **Nome**: `VITE_SUPABASE_URL`
- **Valor**: `https://fqiflmkypcrqavlipjlg.supabase.co`
- **Ambientes**: Production, Preview, Development

### ✅ **Variável 2:**
- **Nome**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Valor**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaWZsbWt5cGNycWF2bGlwamxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI1MDEsImV4cCI6MjA3NzMxODUwMX0.bH0RGXge2ihR82xMO3mgrCn0SpJhKxkwUg5Bm2_Ut04`
- **Ambientes**: Production, Preview, Development

---

## 🚨 **Remover Variáveis Incorretas:**

Se existirem, **REMOVA** estas variáveis incorretas:
- ❌ `VITE_SUPABASE_ANON_KEY`
- ❌ `SUPABASE_URL`

---

## 🔄 **Após Configurar:**

1. **Salve** as configurações
2. **Redeploy** o projeto (ou aguarde próximo push)
3. **Verifique** se o deploy foi bem-sucedido

---

## ✅ **Checklist:**

- [ ] Remover variáveis incorretas
- [ ] Adicionar `VITE_SUPABASE_URL`
- [ ] Adicionar `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Selecionar todos os ambientes
- [ ] Salvar configurações
- [ ] Fazer redeploy

**Após essas configurações, o deploy automático funcionará perfeitamente!** 🚀