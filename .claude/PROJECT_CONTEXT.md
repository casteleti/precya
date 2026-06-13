# PRECYA — Contexto do Projeto

## O Que É
SaaS de gestão de clínicas de estética/saúde. Foco em:
- Agendamento inteligente
- Retenção de clientes (alertas de risco/inatividade)
- Resultados por protocolo
- Anamnese digital

## Estrutura
- `app/frontend` — Next.js 15 + NextAuth (porta 5002)
- `app/backend` — Fastify + Prisma (porta 5003)
- `site/` — Institucional Next.js (porta 5000) — futuro
- `landing/` — Landing pages Astro (porta 5001) — futuro

## Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, NextAuth
- **Backend**: Fastify, TypeScript, Prisma ORM, PostgreSQL, Redis
- **Deploy**: Docker, VPS (167.233.105.48)
- **CI/CD**: GitHub Actions

## Modelo de Dados Central
- `Clinic` → multi-tenant (cada clínica é isolada)
- `Client` → status: ativo | risco | inativo
- `Schedule` → status: not_confirmed | confirmed | completed | cancelled
- `Protocol` → tratamentos com taxa de sucesso
- `SessionFeedback` → rating 1-5 pós-sessão
- `AnamnesisResponse` → histórico versionado

## Regras de Negócio Importantes
- Isolamento por `clinicId` em TODA query
- Cliente "risco" = sem sessão há X dias (configurável)
- LTV calculado em tempo real nas sessões
- Confirmação via WhatsApp antes de cada sessão
