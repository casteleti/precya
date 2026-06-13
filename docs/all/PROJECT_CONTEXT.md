# PROJECT_CONTEXT.md — Contexto para Claude Code/AI

**Versão:** 1.0  
**Projeto:** DAKSA MVP  
**Última atualização:** Junho 2026

---

## 🎯 O Que é Este Arquivo?

Este arquivo é **instruções específicas para Claude** (seja em Claude Code, em um Artifact, ou em conversas). Ele encapsula:
- Contexto técnico do projeto
- Decisões arquiteturais congeladas
- Padrões de código não-negociáveis
- Checklist de qualidade

**Use quando:** Usar Claude para gerar código, arquitetura, ou documentação para DAKSA.

---

## 📌 Contexto Mínimo Obrigatório

### Projeto

- **Nome:** DAKSA MVP
- **Objetivo:** Plataforma SaaS de gestão de clínicas de saúde
- **MVP Timeline:** 7 semanas (Junho 2026)
- **Status:** Em desenvolvimento (Semana 1)

### Stack Técnico (Não negociável)

```
Frontend: Next.js 15 + TypeScript + Tailwind CSS
Backend: Fastify + TypeScript + Prisma
Database: PostgreSQL 16
Cache: Redis 7
Auth: NextAuth.js + JWT local login
Infra: Docker Compose + Traefik
Versioning: Node.js 22 LTS
```

### Decisões Congeladas (10/10)

1. ✅ **Multi-tenant:** SIM, desde o início (WHERE clinicId = ...)
2. ✅ **Overlap detection:** 2 camadas (DB constraint + código)
3. ✅ **Status Schedule:** 4 valores (`not_confirmed|confirmed|completed|canceled`)
4. ✅ **Serviço + Protocolo:** Ambos obrigatórios
5. ✅ **Duração:** Do serviço, mas editável
6. ✅ **Cliente único:** Telefone é PK por clínica (UNIQUE(clinicId, phone))
7. ✅ **Anamnesia:** Customizável + versionada (INSERT, não UPDATE)
8. ✅ **Stripe:** Apenas preparado (não ativar)
9. ✅ **Google Calendar:** Opcional por clínica (preparado)
10. ✅ **Roles:** Preparado, ignorar no MVP

---

## 🏗️ Arquitetura Crítica

### Multi-tenant Enforcement

**Obrigatório em TODA query/mutation:**

```typescript
// ✅ CORRETO
const schedules = await prisma.schedule.findMany({
  where: {
    clinicId: request.user.clinicId,  // ← SEMPRE!
    status: 'confirmed'
  }
});

// ❌ ERRADO (SEGURANÇA)
const schedules = await prisma.schedule.findMany({
  where: { status: 'confirmed' }  // ← Expõe dados de outras clínicas!
});
```

### 2-Layer Overlap Detection

```typescript
// Layer 1: Código (rápido, feedback)
const conflict = await validateConflict(clinicId, startTime, endTime);
if (conflict) throw new ConflictError('SCHEDULE_CONFLICT');

// Layer 2: DB (seguro, race-condition proof)
// CONSTRAINT schedule_no_overlap EXCLUDE USING gist (...)
```

### Anamnesia Versionada

```typescript
// ✅ SEMPRE INSERT (não UPDATE)
const nextVersion = (current?.version ?? 0) + 1;
await prisma.anamnesisResponse.create({
  data: { clientId, version: nextVersion, responses }
});

// ❌ NUNCA UPDATE
await prisma.anamnesisResponse.update({...});  // PROIBIDO!
```

---

## 📋 Estrutura de Pastas

```
daksa-mvp/
├── app/
│   ├── frontend/
│   │   ├── src/app/              (pages)
│   │   ├── src/components/       (componentes reutilizáveis)
│   │   ├── src/lib/              (utils, helpers)
│   │   └── src/styles/           (tailwind config)
│   │
│   └── backend/
│       ├── src/routes/           (endpoints: schedule, client, protocol, auth)
│       ├── src/services/         (business logic)
│       ├── src/middleware/       (auth, error, logging)
│       ├── src/types/            (TypeScript interfaces)
│       ├── prisma/schema.prisma  (ORM schema)
│       └── tests/                (Jest + BDD)
│
├── docs/                         (documentação)
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── deployment/
│   ├── features/
│   └── decisions/               (ADRs)
│
└── .claude/                      (contexto para Claude)
```

---

## 🧪 Qualidade & Testes

### TDD Obrigatório

```
BDD First → Jest Unit → Código para passar

1. Escrever Feature (Gherkin) com scenarios
2. Escrever Jest tests (fixtures, mocks)
3. Escrever código para passar (mínimo, limpo)
4. Não alterar testes; alterar código
```

### Coverage Target

- **Mínimo MVP:** >80%
- **Ideal:** >90%
- **Verificar:** `npm run test:coverage`

### Checklist de Código

```
- [ ] TypeScript sem `any` (stricter typecheck)
- [ ] Sem console.log (usar pino logger)
- [ ] Sem função > 30 linhas (refatorar)
- [ ] Sem duplicação (DRY)
- [ ] Validação com Zod em toda input
- [ ] Error handling explícito
- [ ] Comentários explicam POR QUÊ, não O QUÊ
- [ ] Nomes descritivos (não x, y, z)
- [ ] Multi-tenant WHERE clause em toda query
```

---

## 🔐 Security Checklist

### Autenticação

- [x] NextAuth + JWT com secret rotacionado
- [x] Password hash com bcrypt (cost: 12)
- [x] Token expiry: 3600s
- [x] Refresh token (opcional, preparado)
- [x] Logout invalida session

### Multi-tenant

- [x] clinicId extraído do JWT
- [x] WHERE clinicId = ... em toda query
- [x] Teste de isolamento multi-tenant

### Validação

- [x] Zod schemas em toda input
- [x] Whitelist (não blacklist)
- [x] Error messages genéricas (não leak internals)

### Data

- [x] Passwords nunca em logs
- [x] Secrets em .env (não repo)
- [x] Backup automático
- [x] HTTPS obrigatório em prod

---

## 📊 API Patterns

### Endpoint Naming

```
GET    /api/schedules              → Listar
GET    /api/schedules/:id          → Obter
POST   /api/schedules              → Criar
PATCH  /api/schedules/:id          → Atualizar
DELETE /api/schedules/:id          → Deletar
POST   /api/schedules/:id/complete → Ação específica
```

### Response Format

```json
{
  "data": {...},              // Payload
  "error": null,              // Se houver erro
  "meta": {                   // Opcional
    "timestamp": "...",
    "requestId": "..."
  }
}
```

### Error Codes

```
400: Validation error
401: Unauthorized (sem token)
403: Forbidden (sem permissão)
404: Not found
409: Conflict (ex: SCHEDULE_CONFLICT)
500: Server error
```

---

## 🧩 Componentes Críticos

### Services (Business Logic)

```typescript
// app/backend/src/services/scheduleService.ts

export async function createSchedule(input: CreateScheduleInput) {
  // 1. Validação (Zod)
  // 2. Validação negócio (validateConflict)
  // 3. Transaction (se necessário)
  // 4. Dispatch eventos (N8N job)
  // 5. Return resultado
}
```

### Middleware

```typescript
// app/backend/src/middleware/auth.ts

// Valida JWT, extrai clinicId, injeta em request.user
// Falha: 401 Unauthorized

// Falha: 403 Forbidden (role check)
```

---

## 📈 Performance Targets

| Métrica | Target |
|---------|--------|
| p95 API latency | < 500ms |
| p99 | < 1s |
| p100 (timeout) | > 5s |
| First Contentful Paint | < 2.5s |
| Lighthouse | > 80 |

---

## 🚀 Deployment Checklist

**Antes de push:**
```
- [ ] npm test (todos passam)
- [ ] npm run lint (sem warnings)
- [ ] npm run build (sem erros)
- [ ] git diff (review mudanças)
- [ ] Migrations testadas
```

**Antes de merge:**
```
- [ ] 1 approval (code review)
- [ ] CI/CD green (GitHub Actions)
- [ ] Coverage > 80%
- [ ] Documentação atualizada
```

**Antes de deploy prod:**
```
- [ ] Teste em staging
- [ ] Rollback plan documentado
- [ ] Backup executado
- [ ] Monitoring pronto
```

---

## 💡 Padrões Recomendados

### Error Handling

```typescript
// ✅ Bom
if (notFound) {
  throw new NotFoundError('Schedule não encontrado', { scheduleId });
}

// ❌ Evitar
if (!schedule) throw new Error('error');
```

### Logging

```typescript
// ✅ Bom
logger.info('Schedule criado', { scheduleId, clinicId, duration });
logger.error('Validação falhou', { error, input });

// ❌ Evitar
console.log('ok');
```

### Naming

```typescript
// ✅ Bom
const validateConflictingSchedule = () => {};
const isClientAtRisk = () => {};
const sendWhatsappConfirmation = () => {};

// ❌ Evitar
const check = () => {};
const validate = () => {};
const send = () => {};
```

---

## 📚 Referências Rápidas

- **Documentação técnica:** `docs/`
- **ADRs (decisões):** `docs/decisions/`
- **API endpoints:** `docs/api/ENDPOINTS.md`
- **Schema banco:** `docs/database/SCHEMA.md`
- **Features:** `docs/features/FEATURE_LIST.md`

---

## 🎯 Para Claude Code

### Quando usar Claude para gerar código:

1. **Use este contexto** antes de pedir código
2. **Especifique:** Feature, RF, ou task (ex: "RF-A.2: Criar agendamento")
3. **Peça:** Teste (BDD/Jest) PRIMEIRO, depois código
4. **Valide:** Código passa em testes, segue padrões
5. **Commit:** Com mensagem conventional commits

### Exemplo de prompt bom:

```
Gere código para RF-A.2: Criar Agendamento

Contexto: 
- Backend Fastify, Prisma
- Multi-tenant (WHERE clinicId = request.user.clinicId)
- 2-layer overlap detection
- 4 status values (not_confirmed, confirmed, completed, canceled)

Deliverables:
1. POST /api/schedules endpoint (Fastify route)
2. validateConflict() service
3. Jest tests (coverage > 80%)
4. BDD feature file (Gherkin)

Siga: TypeScript strict, sem any, Zod validation
```

---

**Preparado por:** Ricardo  
**Data:** Junho 2026  
**Próxima revisão:** Após semana 2 (colher learnings)
