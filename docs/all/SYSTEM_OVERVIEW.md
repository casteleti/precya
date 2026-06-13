# System Overview — DAKSA MVP

## 🏗️ Arquitetura

```
┌─────────────────────┐
│  Usuários (Internet) │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Traefik (HTTPS)     │
│ Port 80/443         │
└──────────┬──────────┘
           ↓
    ┌──────┴─────┐
    ↓            ↓
┌─────────┐  ┌──────────┐
│Next.js  │  │ Fastify  │
│App      │  │ Backend  │
│:5002    │  │ :5003    │
└────┬────┘  └────┬─────┘
     │            │
     └──────┬─────┘
            ↓
  ┌─────────────────────┐
  │ PostgreSQL 16       │
  │ Redis 7             │
  └─────────────────────┘
            ↓
  ┌─────────────────────┐
  │ External Services   │
  │ - Twilio (WhatsApp) │
  │ - N8N (Jobs)        │
  │ - Google Calendar   │
  │ - Stripe (Future)   │
  └─────────────────────┘
```

## 🔄 Fluxo de Requisição

1. Cliente POST /api/schedules
2. Traefik roteia para Fastify
3. Middleware valida JWT
4. Service validateConflict() (Layer 1)
5. Prisma INSERT Schedule (Layer 2: EXCLUDE constraint)
6. Dispatch N8N job
7. Response 201

## 📊 Schema

7 tabelas: Clinic, User, Client, Schedule, SessionFeedback, Protocol, AnamnesisResponse

**Multi-tenant:** clinicId em TODA query

---

**Última atualização:** Junho 2026
