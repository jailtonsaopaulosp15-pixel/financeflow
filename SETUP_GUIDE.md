# FinanceFlow - Documentação Completa

## 🚀 Visão Geral

FinanceFlow é um aplicativo moderno e profissional de controle financeiro pessoal, desenvolvido com tecnologias modernas como React, Firebase, Tailwind CSS e PWA. Ele permite que usuários gerenciem suas finanças pessoais com uma interface intuitiva e moderna.

### Tecnologias Utilizadas

- **Frontend**: React 18 + Vite
- **Autenticação**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **Styling**: Tailwind CSS
- **PWA**: Vite PWA Plugin
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand
- **Deploy**: Netlify

---

## 📋 Requisitos

- Node.js 18.0 ou superior
- npm ou yarn
- Uma conta Google/Firebase
- Conta Netlify (para deploy)

---

## 🔧 Passo 1: Criar Projeto Firebase

### 1.1 Acessar Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Faça login com sua conta Google
3. Clique em **"Criar um projeto"**

### 1.2 Configurar Projeto

1. **Nome do Projeto**: `FinanceFlow` (ou nome desejado)
2. **Habilitar Google Analytics**: Opcional (recomendado)
3. Clique em **"Criar projeto"**
4. Aguarde a criação (2-3 minutos)

### 1.3 Adicionar Aplicativo Web

1. No console do projeto, clique em **"Visão Geral"**
2. Clique no ícone **"Web"** (ícone `</>`)
3. **Apelido**: `FinanceFlow Web`
4. Deixe as outras opções como estão
5. Clique em **"Registrar app"**
6. **Copie as credenciais Firebase** (você vai usar no próximo passo)

```javascript
// Exemplo de credenciais (NÃO COMPARTILHE SUAS CREDENCIAIS REAIS)
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "financeflow-xxxxx.firebaseapp.com",
  projectId: "financeflow-xxxxx",
  storageBucket: "financeflow-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxxxxx"
};
```

---

## 🔐 Passo 2: Configurar Autenticação Firebase

### 2.1 Ativar Email/Senha

1. No console Firebase, vá para **Authentication** (Menu esquerdo)
2. Clique na aba **"Sign-in method"**
3. Clique em **"Email/Password"**
4. Habilite as opções:
   - ✅ **Email/Password**
   - ✅ **Email link (passwordless sign-in)**
5. Clique em **"Salvar"**

### 2.2 Configurar Recuperação de Senha

1. Vá para **Settings** (ícone de engrenagem)
2. Selecione a aba **"Templates"**
3. Configure o **Email de Redefinição de Senha** (já vem pré-configurado)

---

## 🗄️ Passo 3: Criar Firestore Database

### 3.1 Criar Database

1. No console Firebase, vá para **Firestore Database** (Menu esquerdo)
2. Clique em **"Criar banco de dados"**
3. **Modo de Segurança**: Selecione **"Começar no modo de teste"**
4. **Localização**: `southamerica-east1` (São Paulo - mais rápido para BR)
5. Clique em **"Ativar"**

### 3.2 Configurar Regras de Segurança

1. No Firestore, vá para a aba **"Regras"**
2. **Substitua todo o conteúdo** pela seguinte regra:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra para dados do usuário
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcoleções do usuário
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Nega acesso a tudo mais
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Clique em **"Publicar"**

### 3.3 Estrutura de Dados

A estrutura do Firestore será criada automaticamente:

```
users/
  ├── {uid}/
  │   ├── email: string
  │   ├── displayName: string
  │   ├── photoURL: string
  │   ├── createdAt: timestamp
  │   ├── lastLogin: timestamp
  │   ├── categories/
  │   │   ├── Salário/
  │   │   ├── Alimentação/
  │   │   └── ... (categorias do usuário)
  │   └── lancamentos/
  │       ├── {transactionId}/
  │       │   ├── userId: string
  │       │   ├── type: 'income' | 'expense'
  │       │   ├── amount: number
  │       │   ├── category: string
  │       │   ├── date: timestamp
  │       │   ├── description: string
  │       │   ├── notes: string
  │       │   ├── attachments: array
  │       │   ├── createdAt: timestamp
  │       │   └── updatedAt: timestamp
```

---

## 💾 Passo 4: Configurar Firebase Storage

### 4.1 Ativar Storage

1. No console Firebase, vá para **Cloud Storage** (Menu esquerdo)
2. Clique em **"Começar"**
3. **Localização**: `southamerica-east1` (São Paulo)
4. Clique em **"Ativar"**

### 4.2 Configurar Regras de Storage

1. No Cloud Storage, vá para a aba **"Regras"**
2. **Substitua todo o conteúdo** pela seguinte regra:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permite upload apenas para usuários autenticados
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Nega acesso a tudo mais
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Clique em **"Publicar"**

---

## 💻 Passo 5: Configurar Projeto Local

### 5.1 Clonar/Preparar Projeto

```bash
# Navegar para pasta do projeto
cd FinanceFlow

# Instalar dependências
npm install
# ou
yarn install
```

### 5.2 Configurar Variáveis de Ambiente

1. **Copie** o arquivo `.env.example` para `.env.local`
   ```bash
   cp .env.example .env.local
   ```

2. **Edite** o arquivo `.env.local` com suas credenciais Firebase:
   ```
   VITE_FIREBASE_API_KEY=seu_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=seu_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id

   VITE_APP_URL=http://localhost:5173
   VITE_APP_ENV=development
   ```

### 5.3 Testar Localmente

```bash
# Iniciar servidor de desenvolvimento
npm run dev
# ou
yarn dev
```

Acesse `http://localhost:5173` no navegador.

---

## 🏗️ Passo 6: Build para Produção

```bash
# Fazer build
npm run build
# ou
yarn build

# Visualizar build
npm run preview
# ou
yarn preview
```

---

## 🚀 Passo 7: Deploy na Netlify

### 7.1 Preparar Projeto para Deploy

1. **Crie um repositório GitHub** (recomendado para CI/CD)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: FinanceFlow setup"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/financeflow.git
   git push -u origin main
   ```

### 7.2 Deploy via Netlify

#### Opção A: Via GitHub (Recomendado)

1. Acesse [Netlify](https://app.netlify.com/)
2. Faça login com GitHub
3. Clique em **"New site from Git"**
4. Selecione **GitHub**
5. Authorize Netlify no GitHub
6. Selecione seu repositório **financeflow**
7. **Configure:**
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
8. Clique em **"Deploy site"**

#### Opção B: Deploy Manual

1. Instale Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Faça login:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

### 7.3 Configurar Variáveis de Ambiente na Netlify

1. Acesse o site no dashboard Netlify
2. Vá para **"Site Settings"** → **"Build & Deploy"** → **"Environment"**
3. Clique em **"Edit Variables"**
4. Adicione as mesmas variáveis do `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=seu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
   VITE_FIREBASE_PROJECT_ID=seu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   VITE_APP_ENV=production
   ```

### 7.4 Configurar Redirecionamentos (Importante!)

1. No Netlify, crie um arquivo `public/_redirects`:
   ```
   /* /index.html 200
   ```

2. Ou configure em `netlify.toml` (já deve estar configurado no vite.config.js)

---

## 📱 Passo 8: Configurar PWA (Opcional mas Recomendado)

### 8.1 Criar Ícones

1. Use uma ferramenta como [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Gere os ícones em diferentes tamanhos
3. Salve em `public/`:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`
   - `maskable-icon-192x192.png`

### 8.2 Criar manifest.json

Crie `public/manifest.json`:
```json
{
  "name": "FinanceFlow - Gestão Financeira",
  "short_name": "FinanceFlow",
  "description": "Aplicativo moderno de controle financeiro pessoal",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 8.3 Habilitar PWA

O vite.config.js já está configurado com o VitePWA plugin. Após o deploy, o app será instalável como PWA!

---

## 🔒 Segurança - Checklist

- ✅ Firestore Rules: Usuários só acessam seus próprios dados
- ✅ Storage Rules: Upload apenas para usuários autenticados
- ✅ Variáveis de Ambiente: Não commitar `.env.local`
- ✅ CORS: Verificar configurações do Firebase
- ✅ HTTPS: Netlify fornece certificado automático

---

## 📊 Estrutura de Arquivos

```
FinanceFlow/
├── public/
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── manifest.json
│   └── _redirects
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   └── NotificationCenter.jsx
│   ├── config/
│   │   └── firebase.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useTransactions.js
│   │   └── useCategories.js
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── AddTransactionPage.jsx
│   │   └── stubs.jsx
│   ├── store/
│   │   └── appStore.js
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── finance.ts
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example
├── .env.local (⚠️ Não commitar)
├── .gitignore
├── package.json
└── README.md
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Cadastro com email e senha
- [x] Login com email e senha
- [x] Logout
- [x] Proteção de rotas
- [x] Dados isolados por usuário

### ✅ Dashboard
- [x] Saldo atual
- [x] Receitas e despesas
- [x] Gráficos de evolução
- [x] Transações recentes
- [x] Estatísticas resumidas

### ✅ Lançamentos
- [x] Adicionar receita
- [x] Adicionar despesa
- [x] Categorias personalizadas
- [x] Data da movimentação
- [x] Observações

### ✅ Design
- [x] Inspirado em Nubank e Banco Inter
- [x] Dark mode
- [x] Tema responsivo
- [x] Animações suaves
- [x] Componentes modernos

### ✅ Armazenamento
- [x] Todos os dados no Firestore
- [x] Estrutura multiusuário
- [x] Sincronização em tempo real

### ✅ PWA
- [x] Instalação no celular
- [x] Manifest configurado
- [x] Service Worker
- [x] Funcionamento offline parcial

---

## 🐛 Troubleshooting

### Erro: "Firebase is not authorized to access..."
- **Solução**: Verificar as Firestore Rules e Storage Rules acima

### Erro: "CORS error"
- **Solução**: Verificar variáveis de ambiente no `.env.local`

### Erro: "User not found"
- **Solução**: Confirmar email na console Firebase

### Build falha no Netlify
- **Solução**: Verificar se todas as variáveis de ambiente estão configuradas

---

## 📚 Recursos Adicionais

- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)
- [Netlify Docs](https://docs.netlify.com)

---

## 📝 Licença

Este projeto é fornecido como exemplo educacional.

---

## 🤝 Suporte

Para dúvidas e sugestões, abra uma issue no repositório GitHub.

---

**Desenvolvido com ❤️ usando React + Firebase + Tailwind CSS**
