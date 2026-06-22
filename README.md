# FinanceFlow - Gestão Financeira Pessoal

Um aplicativo moderno e profissional de controle financeiro pessoal construído com **React**, **Firebase**, **Tailwind CSS** e **PWA**.

![FinanceFlow](https://img.shields.io/badge/React-18-blue?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-green?style=flat-square)

## 🎯 Features

- **Autenticação Segura**: Firebase Auth com email/senha
- **Dashboard Executivo**: Visualize suas finanças em tempo real
- **Transações**: Gerencie receitas e despesas facilmente
- **Categorias**: Organize suas transações por categoria
- **Gráficos**: Visualize sua evolução financeira
- **Dark Mode**: Interface adaptável
- **PWA**: Instale no seu celular como app nativo
- **Cloud Sync**: Sincronização em tempo real via Firebase
- **Multiusuário**: Cada usuário tem seus próprios dados
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Conta Firebase
- Conta Netlify (para deploy)

### Instalação Local

```bash
# 1. Clonar projeto
git clone https://github.com/seu-usuario/financeflow.git
cd FinanceFlow

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env.local (copie de .env.example)
cp .env.example .env.local

# 4. Adicione suas credenciais Firebase no .env.local

# 5. Iniciar desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`

### Build & Deploy

```bash
# Build
npm run build

# Deploy no Netlify
netlify deploy --prod --dir=dist
```

## 📚 Documentação Completa

Para configuração completa do Firebase e instruções de deploy, consulte [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 🏗️ Arquitetura

```
React (UI) 
    ↓
Zustand (State)
    ↓
Firebase (Backend)
    ├── Authentication
    ├── Firestore (Database)
    └── Storage (Uploads)
```

## 📱 Tecnologias

| Tecnologia | Propósito |
|-----------|----------|
| **React 18** | Framework UI |
| **Vite** | Build tool |
| **Firebase** | Backend & Auth |
| **Tailwind CSS** | Styling |
| **Recharts** | Gráficos |
| **Zustand** | State management |
| **Lucide React** | Icons |
| **PWA Plugin** | App instalável |

## 🔒 Segurança

- ✅ Firestore Rules: Isolamento por usuário
- ✅ Storage Rules: Upload protegido
- ✅ Variáveis de ambiente: Não versionadas
- ✅ HTTPS: Automático via Netlify

## 📊 Estrutura Firestore

```
users/{uid}/
  ├── email
  ├── displayName
  ├── categories/
  └── lancamentos/
```

## 🎨 Design

Inspirado em:
- 🏦 Nubank (cores, tipografia, componentes)
- 💳 Banco Inter (layout, cards, animações)

## 📋 Checklist de Deploy

- [ ] Credenciais Firebase configuradas
- [ ] Firestore Rules implementadas
- [ ] Storage Rules configuradas
- [ ] Variáveis de ambiente no Netlify
- [ ] Redirects configurados
- [ ] PWA icons adicionados
- [ ] Manifest.json criado

## 🐛 Troubleshooting

**Erro de CORS?** → Verifique variáveis de ambiente

**Firestore Rules rejection?** → Confira as rules e uid

**Build falha?** → Limpe node_modules e reinstale

## 📖 Guias Relacionados

- [Setup Completo](./SETUP_GUIDE.md)
- [Firebase Console](https://console.firebase.google.com)
- [Netlify Dashboard](https://app.netlify.com)

## 📝 Licença

MIT - Use livremente

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 👨‍💻 Desenvolvido com ❤️

Feito com amor usando as melhores práticas de desenvolvimento web moderno.

---

**Comece agora**: Siga o [SETUP_GUIDE.md](./SETUP_GUIDE.md) para configuração completa!
