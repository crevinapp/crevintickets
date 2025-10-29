# 🚀 Configuração de Deploy Automático - Vercel

Este projeto está configurado para fazer deploy automático no Vercel sempre que você fizer push para o GitHub.

## 📋 Pré-requisitos

1. **Conta no Vercel**: Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. **Projeto no GitHub**: Seu código já está no GitHub ✅

## ⚙️ Configuração Passo a Passo

### 1. Conectar Projeto no Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em **"New Project"**
3. Selecione seu repositório `crevinapp/crevin-pix-tickets`
4. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 3. Configurar GitHub Actions (Opcional - Método Avançado)

Se quiser usar GitHub Actions em vez do deploy automático nativo do Vercel:

1. No GitHub, vá em **Settings > Secrets and variables > Actions**
2. Adicione os seguintes secrets:
   - `VERCEL_TOKEN`: Token da API do Vercel
   - `ORG_ID`: ID da sua organização no Vercel
   - `PROJECT_ID`: ID do projeto no Vercel

Para obter esses valores:
```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Fazer login
vercel login

# Obter informações do projeto
vercel link
```

## 🎯 Como Funciona

### Deploy Automático Nativo (Recomendado)
- ✅ **Push para `master`** → Deploy automático
- ✅ **Pull Request** → Preview deploy
- ✅ **Zero configuração** após setup inicial

### Deploy via GitHub Actions
- ✅ **Push para `master`** → GitHub Actions → Vercel
- ✅ **Controle total** sobre o processo
- ✅ **Logs detalhados** no GitHub

## 🔗 URLs Importantes

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Documentação**: https://vercel.com/docs
- **GitHub Actions**: https://github.com/features/actions

## 🚨 Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme se o comando `npm run build` funciona localmente

### Erro de Variáveis de Ambiente
- Verifique se as variáveis estão configuradas no Vercel
- Confirme se os nomes começam com `VITE_`

### Deploy não Acontece
- Verifique se o repositório está conectado ao Vercel
- Confirme se o webhook do GitHub está ativo

---

**✨ Após a configuração, todo push para o GitHub fará deploy automático no Vercel!**