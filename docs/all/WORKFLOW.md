# WORKFLOW.md — Como Trabalhar no DAKSA MVP

**Versão:** 1.0  
**Duração esperada:** Uma sessão = 2-4 horas de trabalho focado

---

## 🎯 Fluxo Diário (Dev Loop)

### 1️⃣ Selecione uma Task

**Onde encontrar:**
- `TASKS.md` → Priorizado por semana
- `FEATURE_LIST.md` → Por feature area
- GitHub Issues → Tarefas mais granulares

**Exemplo:**
```
TASK-011: POST /api/schedules (criar agendamento)
Status: P1 (Crítico Semana 2-3)
Estimate: 3h
```

### 2️⃣ Entenda o Contexto

**Leia:**
1. Task description completa
2. Correspondente RF (Requisite Funcional) em `FEATURE_LIST.md`
3. ADR relacionado (se houver)
4. Tabela de dados em `SCHEMA.md`
5. Endpoint em `ENDPOINTS.md` (se houver)

**Exemplo para TASK-011:**
```
RF-A.2: Criar Agendamento
ADR-001: 4 status values
ADR-003: 2-layer overlap detection

Schema: Schedule (7 colunas)
Response: 201 ou 409 SCHEDULE_CONFLICT
```

### 3️⃣ Escreva Teste Primeiro (TDD)

**Ordem:** BDD → Jest → Código

#### BDD (Gherkin)

```bash
# Feature file: app/backend/tests/features/schedule.feature
```

```gherkin
Feature: Criar Agendamento

  Background:
    Given clínica "clinic_1"
    And cliente "client_1"

  Scenario: Criar sem conflito
    When POST /api/schedules {
      clientId: "client_1",
      serviceId: "service_1",
      startTime: "2026-02-20T14:00:00Z",
      duration: 60
    }
    Then status = 201
    And response.status = "not_confirmed"
    And whatsappSent = false

  Scenario: Conflito → 409
    Given agendamento "14:00-15:00" existente
    When POST /api/schedules { startTime: "14:30", duration: 60 }
    Then status = 409
    And code = "SCHEDULE_CONFLICT"
```

**Rodar:**
```bash
npm run test:bdd
# Expected: PENDING (não existe código ainda)
```

#### Jest Tests

```typescript
// app/backend/tests/services/scheduleService.test.ts

describe('ScheduleService.createSchedule', () => {
  beforeEach(async () => {
    // Setup fixtures
    await setupDatabase();
  });

  it('should create schedule without conflict', async () => {
    const result = await scheduleService.createSchedule(
      {
        clientId: 'client_1',
        serviceId: 'service_1',
        startTime: new Date('2026-02-20T14:00:00Z'),
        duration: 60
      },
      'clinic_1'
    );

    expect(result.id).toBeDefined();
    expect(result.status).toBe('not_confirmed');
    expect(result.whatsappSent).toBe(false);
  });

  it('should throw ConflictError on overlap', async () => {
    // Create conflicting schedule first
    await prisma.schedule.create({...});

    expect(
      scheduleService.createSchedule({...overlapping...}, 'clinic_1')
    ).rejects.toThrow(ConflictError);
  });
});
```

**Rodar:**
```bash
npm test
# Expected: FAILED (código não existe)
```

### 4️⃣ Escreva Código Mínimo

**Princípio:** Faça o teste passar com mínimo de código limpo.

```typescript
// app/backend/src/services/scheduleService.ts

export class ScheduleService {
  async createSchedule(
    input: CreateScheduleInput,
    clinicId: string
  ): Promise<Schedule> {
    // 1. Validar input
    const validated = createScheduleSchema.parse(input);
    
    // 2. Validar negócio (2-layer: Layer 1)
    const conflict = await this.validateConflict(
      clinicId,
      validated.startTime,
      new Date(validated.startTime.getTime() + validated.duration * 60000)
    );
    
    if (conflict) {
      throw new ConflictError('SCHEDULE_CONFLICT', {
        conflictingScheduleId: conflict.id
      });
    }
    
    // 3. Criar
    const schedule = await this.prisma.schedule.create({
      data: {
        ...validated,
        clinicId,
        status: 'not_confirmed',
        whatsappSent: false,
        whatsappConfirmed: false
      }
    });
    
    // 4. Side effect (N8N job)
    await this.dispatchN8NJob('schedule-created', { scheduleId: schedule.id });
    
    return schedule;
  }

  private async validateConflict(
    clinicId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Schedule | null> {
    return this.prisma.schedule.findFirst({
      where: {
        clinicId,
        status: { not: 'canceled' },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      },
      take: 1
    });
  }
}
```

**Rodar:**
```bash
npm test
# Expected: ✅ PASSED
```

### 5️⃣ Refatore (Se Necessário)

**Não altere testes.** Se código está feio:

```typescript
// ANTES (repetido)
const schedule1 = await createSchedule(...);
await dispatchJob('schedule-created', { scheduleId: schedule1.id });
const schedule2 = await createSchedule(...);
await dispatchJob('schedule-created', { scheduleId: schedule2.id });

// DEPOIS (refatorado, testes iguais)
async createAndNotify(inputs: Input[], clinicId: string) {
  const schedules = await Promise.all(
    inputs.map(input => this.createSchedule(input, clinicId))
  );
  await Promise.all(
    schedules.map(s => this.dispatchN8NJob('schedule-created', { scheduleId: s.id }))
  );
  return schedules;
}
```

### 6️⃣ Implemente Endpoint (Route + Controller)

```typescript
// app/backend/src/routes/schedule.routes.ts

export async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateScheduleInput }>(
    '/schedules',
    {
      schema: {
        description: 'Criar novo agendamento',
        body: createScheduleSchema
      }
    },
    async (request, reply) => {
      try {
        const schedule = await scheduleService.createSchedule(
          request.body,
          request.user.clinicId  // ← Multi-tenant!
        );
        return reply.code(201).send(schedule);
      } catch (error) {
        if (error instanceof ConflictError) {
          return reply.code(409).send({
            code: error.code,
            message: error.message,
            details: error.details
          });
        }
        throw error;  // Let error handler deal
      }
    }
  );
}
```

### 7️⃣ Testes End-to-End (Opcional)

```bash
# Se mudança é crítica:
npm run test:e2e

# Exemplo com Supertest:
it('POST /api/schedules 201', async () => {
  const response = await request(app)
    .post('/api/schedules')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId: 'client_1',
      serviceId: 'service_1',
      startTime: '2026-02-20T14:00:00Z',
      duration: 60
    });

  expect(response.status).toBe(201);
  expect(response.body.status).toBe('not_confirmed');
});
```

### 8️⃣ Commit & Push

**Padrão Conventional Commits:**

```bash
git add .
git commit -m "feat(schedule): add overlap detection with 2-layer validation

- Implement validateConflict() service (Layer 1: code)
- EXCLUDE constraint in migration (Layer 2: DB)
- POST /api/schedules with 409 SCHEDULE_CONFLICT response
- Comprehensive BDD + Jest tests (coverage > 85%)

Closes #TASK-011"

git push origin feature/schedule-create
```

### 9️⃣ Code Review

**Pede aprovação** (1 reviewer mínimo)

**Checklist automático:**
- ✅ Lint sem erros
- ✅ Testes passam (BDD + Jest)
- ✅ Coverage > 80%
- ✅ TypeScript strict

**Reviewer verifica:**
- [ ] Código segue padrões (CODING_STANDARDS.md)
- [ ] Multi-tenant enforcement (WHERE clinicId)
- [ ] Teste coverage adequado
- [ ] Documentação atualizada
- [ ] Sem breaking changes

### 🔟 Merge & Deploy

**Merge automático quando:**
- Reviewer aprovou
- CI/CD passou
- Nenhum conflito

```bash
git checkout develop
git merge feature/schedule-create
git push origin develop  # Auto-deploys to staging
```

---

## 📊 Estrutura de uma Sessão (2-4 horas)

| Tempo | Atividade | Checkpoint |
|-------|-----------|-----------|
| 0:00-0:15 | Selecionar task + ler contexto | Entende o que fazer? |
| 0:15-0:45 | Escrever BDD scenarios + Jest tests | Testes compilam, passam? |
| 0:45-1:30 | Implementar código + service | Testes passam? |
| 1:30-1:45 | Implementar endpoint + route | `npm run dev` funciona? |
| 1:45-2:00 | Refatorar (se necessário) | Código fica limpo? |
| 2:00-2:10 | Test final + lint | `npm test && npm run lint` ✅ |
| 2:10-2:20 | Commit + push | Git push sem erro |
| 2:20+ | Code review + merge | Aguarda aprovação |

**Exemplo real:**
```
13:00 - Lê TASK-011
13:15 - Escreve schedule.feature (8 scenarios)
13:30 - Escreve schedule.test.ts (10+ tests)
14:00 - Implementa ScheduleService.createSchedule()
14:30 - Implementa POST /api/schedules endpoint
14:45 - Refactor validateConflict() para ficar <15 linhas
14:55 - npm test ✅ + npm run lint ✅
15:05 - git commit + git push
15:10 - Pede code review
15:30+ - Aguarda + merge
```

---

## 🔄 Branch Strategy (Git Flow)

### Novo Feature

```bash
# 1. Criar branch from develop
git flow feature start schedule-create
# = git checkout -b feature/schedule-create develop

# 2. Trabalhar (commits pequenos)
git commit -m "feat(schedule): add validateConflict service"
git commit -m "feat(schedule): add POST /api/schedules endpoint"

# 3. Terminar
git flow feature finish schedule-create
# = git checkout develop && git merge feature/schedule-create

# 4. Push
git push origin develop
```

### Branches Principais

```
main (produção)
  ↑
  └─ develop (staging)
      ↑
      ├─ feature/schedule-*
      ├─ feature/client-*
      ├─ feature/protocol-*
      ├─ fix/bug-name
      └─ docs/readme-update
```

---

## 🐛 Debugging

### Local

```bash
# 1. Dev server with watch
npm run dev

# 2. Open browser
http://localhost:5002  # Frontend
http://localhost:5003  # Backend API

# 3. Test endpoint
curl -X POST http://localhost:5003/api/schedules \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# 4. View logs
docker logs -f precya_backend

# 5. Query database
docker exec -it precya_postgres psql -U daksa_user -d precya_prod
SELECT * FROM "Schedule" WHERE "clinicId" = 'clinic_1';
```

### Quando Teste Falha

```bash
# 1. Rodar com verbose
npm test -- --verbose

# 2. Verificar setup/teardown
# (beforeEach cleanup properly?)

# 3. Adicionar console logs (temporário)
console.log('Schedule:', schedule);

# 4. Usar jest.only para isolar
it.only('should create schedule', async () => {...});

# 5. Debugger
node --inspect-brk node_modules/.bin/jest schedule.test.ts
```

---

## 📝 Documentação

**Quando atualizar:**

| Arquivo | Quando |
|---------|--------|
| `TASKS.md` | Task completada (mark as done) |
| `FEATURE_LIST.md` | Feature completada (move to ✅) |
| `docs/api/ENDPOINTS.md` | Novo endpoint implementado |
| `docs/database/SCHEMA.md` | Nova migração criada |
| `ROADMAP.md` | Semana terminada (retrospectiva) |

**Exemplo:**
```bash
# Após implementar POST /api/schedules:
# 1. Update ENDPOINTS.md com exemplo de resposta
# 2. Update SCHEMA.md se tabelas mudam
# 3. Update FEATURE_LIST.md (A.2 → ✅)
# 4. Update TASKS.md (TASK-011 → DONE)
```

---

## 🎓 Quick Reference

### Selecionar Task

```bash
# Próximas tasks por semana
cat TASKS.md | grep "^## 🟠 P1"
```

### Rodar Testes

```bash
npm test              # Jest + BDD
npm run test:bdd      # Só Cucumber
npm run test:coverage # Com coverage report
```

### Lint & Format

```bash
npm run lint          # Check ESLint
npm run format        # Auto-fix with Prettier
```

### Git Convenção

```
feat(area): short summary
fix(area): ...
docs(area): ...
test(area): ...
refactor(area): ...
```

### Deploy Local

```bash
docker-compose down
docker-compose up -d
npm run prisma:migrate dev
npm run dev
```

---

## ✅ Pre-Commit Checklist

Antes de `git commit`:

```
- [ ] npm test passa
- [ ] npm run lint sem warnings
- [ ] npm run build sem erros
- [ ] TypeScript strict sem erros
- [ ] Nenhum console.log deixado
- [ ] Variáveis sem unused
- [ ] BDD tests (feature escrita)
- [ ] Jest tests (> 80% coverage)
- [ ] Documentação atualizada (se necessário)
```

---

## 🆘 Problemas Comuns

### "Teste falha intermitentemente"

**Problema:** Testes paralelos causando race condition  
**Solução:**
```bash
npm test -- --runInBand  # Rodar sequencial
```

### "Port already in use"

**Problema:** Docker container ainda rodando  
**Solução:**
```bash
docker-compose down
docker-compose up -d
```

### "TypeScript erro que não entendo"

**Solução:**
```bash
npx tsc --noEmit  # Rodar type checker isolado
```

---

**Última atualização:** Junho 2026  
**Próxima revisão:** Após semana 1 (feedback do time)
