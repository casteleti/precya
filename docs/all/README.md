# DAKSA MVP — Gestão Inteligente de Clínicas

![Status](https://img.shields.io/badge/status-development-yellow)
![Node.js](https://img.shields.io/badge/node-22.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**DAKSA** é uma plataforma SaaS para gestão inteligente de clínicas de saúde (terapeutas, psicólogos, fisioterapeutas). Oferece agendamento, gestão de clientes, protocolos de tratamento e automações com WhatsApp.

## 🎯 Objetivo

Ser a solução **production-ready, escalável e de fácil uso** para clínicas gerenciarem agendamentos, clientes e protocolos de tratamento em um único lugar.

## ✨ Features Principais (MVP)

- ✅ **Agenda Inteligente** — Agendamentos com detecção de conflitos (2 camadas: DB + código)
- ✅ **Gestão de Clientes** — Perfil completo com histórico e anamnesia versionada
- ✅ **Protocolos de Tratamento** — Rastreamento de sessões e analytics
- ✅ **Confirmação por WhatsApp** — Job 24h antes com webhook de confirmação
- ✅ **Multi-tenant** — Desde o início, isolamento de dados por clínica
- ✅ **Autenticação Segura** — NextAuth.js + JWT local login
- ✅ **Mobile-First Design** — Responsivo para terapeuta em movimento

## 🏗️ Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js 15 + TypeScript | Latest |
| Backend | Fastify + Zod | Latest |
| Database | PostgreSQL 16 | Alpine |
| Cache | Redis 7 | Alpine |
| ORM | Prisma 5 | Latest |
| Auth | NextAuth.js | Latest |
| Infra | Docker Compose | 5.1.4 |
| Proxy | Traefik | v3.6 |

## 🚀 Quick Start

### Pré-requisitos

```bash
- Node.js 22 LTS
- Docker 29.5+
- Docker Compose 5.1+
- Git
```

### Setup Local

```bash
# Clone repo
git clone https://github.com/seu-repo/daksa-mvp.git
cd daksa-mvp

# Install dependencies
npm install
cd app/frontend && npm install
cd ../backend && npm install

# Setup .env
cp .env.example .env.local

# Start Docker
docker-compose up -d

# Migrações Prisma
cd app/backend
npm run prisma:migrate dev

# Run dev
npm run dev
```

**Acesso:**
- App: http://localhost:5002
- Backend API: http://localhost:5003/api/health
- Swagger Docs: http://localhost:5003/api/docs

## 📚 Documentação

- **[PROJECT_BRIEF.md](./PROJECT_BRIEF.md)** — Objetivos e personas
- **[ROADMAP.md](./ROADMAP.md)** — Milestones e timeline
- **[TASKS.md](./TASKS.md)** — Backlog priorizado
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Como contribuir
- **[docs/](./docs/)** — Documentação técnica

## 🔧 Desenvolvimento

### Estrutura de Pastas

```
daksa-mvp/
├── app/
│   ├── frontend/          (Next.js App)
│   └── backend/           (Fastify API)
├── docs/                  (Documentação)
└── .claude/               (Context para IA)
```

### Branches

```
main (produção)
  ↑
  └─ develop (staging)
      ↑
      ├─ feature/schedule-*
      ├─ feature/client-*
      └─ feature/protocol-*
```

### Testes

```bash
npm test              # Jest + BDD
npm run test:coverage # Com coverage
```

**Target: Coverage > 80%**

## 🚢 Deployment

```bash
ssh deploy@167.233.105.48
cd /srv/stack
docker-compose pull
docker-compose up -d
```

## 🤝 Contribuindo

Leia [CONTRIBUTING.md](./CONTRIBUTING.md) para padrões de código e processo de PR.

## 📄 Licença

MIT License — Veja [LICENSE](./LICENSE)

---

**Status:** MVP em desenvolvimento 🚀  
**Última atualização:** Junho 2026
