# ⚡ Guia Rápido - FinanceFlow (5 minutos)

## PASSO 1️⃣: Clonar o Projeto

```bash
cd ~/Desktop  # ou pasta desejada
git clone https://github.com/seu-usuario/financeflow.git
cd FinanceFlow
npm install
```

**Tempo**: 2-3 minutos

---

## PASSO 2️⃣: Criar Firebase Project

### Ir para Firebase Console
1. Acesse https://console.firebase.google.com
2. Clique em **"Criar um projeto"**
3. Nome: `FinanceFlow`
4. Clique em **"Criar"** e aguarde 2 min

### Adicionar App Web
1. Na página do projeto, clique no ícone **`</>`**
2. Apelido: `FinanceFlow`
3. Clique em **"Registrar"**
4. **COPIE ESTAS LINHAS** (firebaseConfig):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "financeflow-abc123.firebaseapp.com",
  projectId: "financeflow-abc123",
  storageBucket: "financeflow-abc123.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

**Tempo**: 2-3 minutos

---

## PASSO 3️⃣: Configurar Firebase

### 3.1 Autenticação
1. Menu esquerda → **Authentication**
2. Aba **"Sign-in method"** → **Email/Password**
3. Ativar ✅ Email/Password
4. Clique **"Salvar"**

### 3.2 Firestore Database
1. Menu esquerda → **Firestore Database**
2. Clique **"Criar banco de dados"**
3. Modo: **"Começar no modo de teste"**
4. Localização: `southamerica-east1`
5. Clique **"Ativar"**

### 3.3 Copiar Regras Firestore
1. Aba **"Regras"** no Firestore
2. **SUBSTITUA** todo o código por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Clique **"Publicar"**

### 3.4 Cloud Storage
1. Menu esquerda → **Cloud Storage**
2. Clique **"Começar"**
3. Localização: `southamerica-east1`
4. Clique **"Ativar"**

Depois vá na aba **"Regras"** e substitua por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Clique **"Publicar"**

**Tempo**: 3-4 minutos

---

## PASSO 4️⃣: Conectar Firebase ao Projeto

### Criar .env.local

Na pasta do projeto, crie arquivo `.env.local`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=financeflow-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=financeflow-abc123
VITE_FIREBASE_STORAGE_BUCKET=financeflow-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123...

VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=development
```

### Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

**Tempo**: 1 minuto

---

## PASSO 5️⃣: Deploy na Netlify

### Via Netlify CLI (Mais rápido)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Fazer build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Via GitHub + Netlify (Recomendado para CI/CD)

```bash
# 1. Criar repositório no GitHub (mínimo 2 min)
git remote add origin https://github.com/seu-usuario/financeflow.git
git branch -M main
git push -u origin main

# 2. Ir para https://app.netlify.com
# 3. Clique "New site from Git"
# 4. Conectar GitHub
# 5. Selecionar seu repositório
# 6. Build command: npm run build
# 7. Publish: dist
# 8. Clique "Deploy"

# 9. Em "Site Settings" → "Build & Deploy" → "Environment"
# 10. Adicionar mesmas variáveis do .env.local
```

**Tempo**: 3-5 minutos (primeira vez)

---

## ✅ Pronto! Agora você tem:

- ✅ App FinanceFlow rodando localmente
- ✅ Firebase configurado e seguro
- ✅ App publicado online
- ✅ PWA pronto para instalar no celular

---

## 🧪 Testar no Celular

1. Acesse seu app Netlify pelo celular
2. Menu → **Instalar app** (ou "Add to Home Screen")
3. Abra o app como se fosse nativo!

---

## 🆘 Problemas Comuns?

| Erro | Solução |
|------|---------|
| `Firebase is not authorized` | Verifique Firestore Rules acima |
| `User not found` | Confirme email no Firebase Console |
| `CORS error` | Verifique variáveis em .env.local |
| Build falha no Netlify | Adicione variáveis em Site Settings |

---

## 📚 Documentação Completa

Veja [SETUP_GUIDE.md](./SETUP_GUIDE.md) para mais detalhes.

---

**🎉 Parabéns! Você tem um app financeiro profissional rodando!**

Próximos passos:
- Customizar cores e logo
- Adicionar mais funcionalidades
- Coletar feedback dos usuários
- Expandir recursos
