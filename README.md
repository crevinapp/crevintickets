# Crevin Tickets 🎫

Sistema de venda de ingressos para eventos desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel
- **Pagamentos**: PIX (integração personalizada)

## 📋 Funcionalidades

- ✅ Listagem de eventos
- ✅ Detalhes do evento
- ✅ Carrinho de compras
- ✅ Checkout com PIX
- ✅ Painel administrativo
- ✅ Gerenciamento de pedidos
- ✅ Comprovantes de pagamento

## 🛠️ Configuração Local

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd crevintickets
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_publishable_key"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
```

### 4. Execute o projeto
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

## 🚀 Deploy Automático

Este projeto está configurado com deploy automático no Vercel:

- ✅ **GitHub Actions**: Configurado para deploy automático
- ✅ **Vercel Integration**: Deploy em cada push para `master`
- ✅ **Environment Variables**: Configuradas no Vercel Dashboard
- ✅ **Production Ready**: Otimizado para produção

### Variáveis de Ambiente no Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9e6c3d69-3d24-4759-b407-895ca8a504fb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
