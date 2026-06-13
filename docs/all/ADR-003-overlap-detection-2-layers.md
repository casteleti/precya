# ADR-003: Overlap Detection — 2-Layer (EXCLUDE Constraint + Application)

**Status:** ACCEPTED  
**Decided:** Junho 2026  
**Deciders:** Ricardo (Product/Tech Lead)  

---

## 📋 Problema

Como prevenir sobreposição de agendamentos na mesma clínica?

**Desafios:**
1. Múltiplos agendamentos simultâneos (race condition)
2. Performance: evitar SELECT + INSERT lento
3. UX: feedback rápido (não esperar 5s)
4. Confiabilidade: garantia de integridade DB

**Opções consideradas:**
1. Só SELECT em código (sem DB constraint)
2. Só DB EXCLUDE constraint (sem validação prévia)
3. 2-layer: Validação em código + EXCLUDE constraint

---

## 🎯 Decisão

**Adotar 2-layer:**

```
┌─────────────────────────────────────────┐
│ Layer 1: Application (Código)           │
│ validateConflict() → SELECT + lógica    │
│ ✓ Feedback rápido (50ms)                │
│ ✓ UX melhor (não quer 409)              │
│ ✓ Economiza round-trip DB               │
│ ✗ Não previne race condition sozinho    │
└─────────────────────────────────────────┘
                    ↓
            INSERT Schedule
                    ↓
┌─────────────────────────────────────────┐
│ Layer 2: Database (EXCLUDE constraint)  │
│ EXCLUDE USING gist (clinicId, timerange)│
│ ✗ Mais lenta (rejeita no commit)        │
│ ✓ Previne race condition                │
│ ✓ Garantia matemática (impossível erro) │
│ ✓ Proteção contra bugs em código       │
└─────────────────────────────────────────┘
```

---

## 🤔 Justificativa

### Por que não só código?

❌ **Só SELECT + validação:**
```javascript
// Race condition possível!
const conflict = await validateConflict(clinicId, startTime, endTime);
if (conflict) throw new ConflictError();

// ← AQUI: Thread B cria agendamento
// ← que conflita, mas passou em validateConflict

await prisma.schedule.create({...});  // ← Ambos inserem!
```

**Problema:**
- 2 threads passam na validação
- Ambas inserem no DB
- Nenhuma constraint impede (sem Layer 2)
- Banco fica inconsistente

### Por que não só DB?

❌ **Só EXCLUDE constraint:**
```sql
-- DB rejeita, mas... 
INSERT INTO Schedule (...) VALUES (...);
-- Error: violates exclude constraint
```

**Problemas:**
- Feedback lento (espera round-trip INSERT)
- UX ruim: usuário vê erro após submeter
- Load desnecessário no DB (tenta inserir só para rejeitar)
- Sem pré-validação = experiência ruim

### Por que exatamente 2-layer?

✅ **Best of both worlds:**

1. **Layer 1 (Code):**
   - Rápido: 50-100ms no máximo
   - UX: Feedback antes de submeter
   - Eficiente: evita INSERT rejeitado
   - Business logic: customizável

2. **Layer 2 (Database):**
   - Seguro: impossível passar (constraint matemático)
   - Race-condition proof
   - Proteção contra bugs em código
   - Garantia de integridade

---

## 🏗️ Arquitetura Detalhada

### Layer 1: Validação em Código

**Algoritmo:** Overlap detection

```typescript
// app/backend/src/services/scheduleService.ts

async function validateConflict(
  clinicId: string,
  startTime: Date,
  endTime: Date
): Promise<Schedule | null> {
  // Query existentes que PODEM sobrepor
  const conflicts = await prisma.schedule.findMany({
    where: {
      clinicId,
      status: { not: 'canceled' },  // Ignorar cancelados
      
      // Lógica de overlap:
      // novo.start < existente.end  AND
      // novo.end > existente.start
      AND: [
        { startTime: { lt: endTime } },      // novo começa antes de existente acabar
        { endTime: { gt: startTime } }       // novo termina depois de existente começar
      ]
    },
    take: 1  // Só precisa de 1, não de todos
  });
  
  return conflicts.length > 0 ? conflicts[0] : null;
}

// Uso no controller
async function createSchedule(req: Request, res: Response) {
  const { clientId, startTime, duration } = req.body;
  
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  // Layer 1: Validação rápida em código
  const conflict = await validateConflict(req.user.clinicId, startTime, endTime);
  if (conflict) {
    return res.status(409).json({
      code: 'SCHEDULE_CONFLICT',
      message: 'Este horário está ocupado',
      details: { conflictingScheduleId: conflict.id }
    });
  }
  
  // Se passou em Layer 1, tenta inserir (Layer 2 valida novamente)
  const schedule = await prisma.schedule.create({
    data: {
      clinicId: req.user.clinicId,
      clientId,
      startTime,
      endTime,
      status: 'not_confirmed'
    }
  });
  
  return res.status(201).json(schedule);
}
```

**Performance:** ~50ms (SSD PostgreSQL)

### Layer 2: Constraint no Banco

**Database constraint:**

```sql
-- Habilitar extensão necessária
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Constraint: previne overlap na mesma clínica
ALTER TABLE "Schedule" 
ADD CONSTRAINT "schedule_no_overlap" 
EXCLUDE USING gist (
  "clinicId" WITH =,              -- Mesma clínica?
  tsrange("startTime", "endTime", '[)') WITH &&  -- Overlaps?
)
WHERE "status" != 'canceled';      -- Ignorar cancelados
```

**Como funciona:**
- `tsrange()` = timestamp range (ex: [14:00, 15:00))
- `&&` = overlap operator (ranges sobrepõem?)
- `EXCLUDE` = se nenhuma combinação pode ter mesmo valor
- `WHERE` = constraint condicional (não aplica a canceled)

**Exemplo:**

```sql
-- Existente
INSERT INTO Schedule (clinicId, startTime, endTime, status) 
VALUES ('clinic_1', '2026-02-20 14:00', '2026-02-20 15:00', 'confirmed');
✅ Sucesso

-- Tentativa de overlap (Layer 1 rejeita, mas vamos ignorar)
INSERT INTO Schedule (clinicId, startTime, endTime, status) 
VALUES ('clinic_1', '2026-02-20 14:30', '2026-02-20 15:30', 'confirmed');
❌ ERRO: violates exclude constraint "schedule_no_overlap"

-- OK: mesma clínica, mas sem overlap
INSERT INTO Schedule (clinicId, startTime, endTime, status) 
VALUES ('clinic_1', '2026-02-20 15:00', '2026-02-20 16:00', 'confirmed');
✅ Sucesso (começa exatamente quando a anterior termina)

-- OK: clínica diferente, mesmo horário
INSERT INTO Schedule (clinicId, startTime, endTime, status) 
VALUES ('clinic_2', '2026-02-20 14:00', '2026-02-20 15:00', 'confirmed');
✅ Sucesso (multi-tenant isolamento funciona)

-- OK: cancelados podem "sobrepor"
INSERT INTO Schedule (clinicId, startTime, endTime, status) 
VALUES ('clinic_1', '2026-02-20 14:00', '2026-02-20 15:00', 'canceled');
✅ Sucesso (cancelados ignorados pela constraint)
```

---

## 🔄 Flow Completo: 2-Layer em Ação

```
┌──────────────────────────────────────────────────┐
│ Cliente A e B submitem agendamento 14:30-15:30   │
│ Ambos para mesma clínica                         │
└──────────────────┬───────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
   ┌─────────────┐       ┌─────────────┐
   │ Request A   │       │ Request B   │
   │ validateC() │       │ validateC() │
   │ (50ms)      │       │ (50ms)      │
   └──────┬──────┘       └──────┬──────┘
          │                     │
    SELECT: Não há  │      SELECT: Há conflito!
    conflito        │      Retorna 409
    ✓ Passa        │      
    ↓              │      └─ Response 409
  INSERT (race!)   │      Client recebe feedback
    ↓              │      imediato
    │              ↓
    └──────→ ┌──────────────┐
             │ Constraint   │
             │ EXCLUDE      │
             │ valida       │
             └────┬─────────┘
                  │
             A passou (foi 1º)
             B foi rejeito... mas já tinha 409
             
  ✅ Resultado: Apenas 1 agendamento criado
  ✅ Segurança: garantida em 2 níveis
```

---

## 📊 Race Condition Analysis

### Cenário 1: Sem Layer 2

```
T=0ms   Request A: validateConflict() → Nenhum conflito
T=1ms   Request B: validateConflict() → Nenhum conflito
T=2ms   Request A: INSERT Schedule    → SUCCESS
T=3ms   Request B: INSERT Schedule    → SUCCESS (sobrepõe!)
Result: BUG - Ambos inserem
```

### Cenário 2: Com Layer 2

```
T=0ms   Request A: validateConflict() → Nenhum conflito
T=1ms   Request B: validateConflict() → Nenhum conflito
T=2ms   Request A: INSERT Schedule    → Constraint OK, SUCCESS
T=3ms   Request B: INSERT Schedule    → Constraint FAIL! (sobrepõe)
Result: SEGURO - Constraint impede B
```

---

## 🧪 Testes

### BDD: Overlap Detection

```gherkin
Feature: Conflito de Horário - 2-Layer Detection

  Background:
    Given agendamento existente:
      | startTime           | endTime             |
      | 2026-02-20 14:00:00 | 2026-02-20 15:00:00 |

  Scenario: Overlap total (14:30-15:30)
    When POST /api/schedules { startTime: 14:30, duration: 60 }
    Then status 409
    And code = "SCHEDULE_CONFLICT"
    And details.conflictingScheduleId está presente

  Scenario: Overlap início (14:00-14:30)
    When POST /api/schedules { startTime: 14:00, duration: 30 }
    Then status 409
    And code = "SCHEDULE_CONFLICT"

  Scenario: Overlap fim (14:45-15:45)
    When POST /api/schedules { startTime: 14:45, duration: 60 }
    Then status 409
    And code = "SCHEDULE_CONFLICT"

  Scenario: Sem overlap (15:00-16:00)
    When POST /api/schedules { startTime: 15:00, duration: 60 }
    Then status 201
    And schedule criado com sucesso

  Scenario: Sem overlap (13:00-14:00)
    When POST /api/schedules { startTime: 13:00, duration: 60 }
    Then status 201
    And schedule criado com sucesso

  Scenario: Cancelados são ignorados
    Given agendamento com status = "canceled"
    When POST /api/schedules { overlapping time }
    Then status 201 (não conflita com cancelado)

  Scenario: Multi-tenant isolamento
    Given agendamento em clinic_1
    When POST /api/schedules clinic_2 { mesmo horário }
    Then status 201 (clinics isoladas)

  Scenario: Layer 2 valida mesmo que Layer 1 falhe
    When bypassar validação em código (teste direto DB)
    And tentar INSERT com overlap
    Then CONSTRAINT VIOLATION (Layer 2 salva)
```

### Jest: validateConflict()

```typescript
describe('ScheduleService', () => {
  describe('validateConflict', () => {
    beforeEach(async () => {
      // Clear and seed
      await prisma.schedule.deleteMany({});
      
      // Existing: 14:00-15:00
      await prisma.schedule.create({
        data: {
          clinicId: 'clinic_1',
          clientId: 'client_1',
          startTime: new Date('2026-02-20T14:00:00Z'),
          endTime: new Date('2026-02-20T15:00:00Z'),
          status: 'confirmed'
        }
      });
    });

    it('should detect total overlap', async () => {
      const result = await validateConflict(
        'clinic_1',
        new Date('2026-02-20T14:30:00Z'),
        new Date('2026-02-20T15:30:00Z')
      );
      expect(result).not.toBeNull();
      expect(result.id).toBeDefined();
    });

    it('should detect start overlap', async () => {
      const result = await validateConflict(
        'clinic_1',
        new Date('2026-02-20T14:00:00Z'),
        new Date('2026-02-20T14:30:00Z')
      );
      expect(result).not.toBeNull();
    });

    it('should allow no overlap (after)', async () => {
      const result = await validateConflict(
        'clinic_1',
        new Date('2026-02-20T15:00:00Z'),
        new Date('2026-02-20T16:00:00Z')
      );
      expect(result).toBeNull();
    });

    it('should allow no overlap (before)', async () => {
      const result = await validateConflict(
        'clinic_1',
        new Date('2026-02-20T13:00:00Z'),
        new Date('2026-02-20T14:00:00Z')
      );
      expect(result).toBeNull();
    });

    it('should ignore canceled schedules', async () => {
      // Create canceled with overlap
      await prisma.schedule.create({
        data: {
          clinicId: 'clinic_1',
          clientId: 'client_2',
          startTime: new Date('2026-02-20T14:00:00Z'),
          endTime: new Date('2026-02-20T15:00:00Z'),
          status: 'canceled'
        }
      });

      const result = await validateConflict(
        'clinic_1',
        new Date('2026-02-20T14:00:00Z'),
        new Date('2026-02-20T15:00:00Z')
      );
      expect(result).toBeNull();  // Ignored canceled
    });

    it('should isolate by clinicId', async () => {
      // Same time, different clinic
      const result = await validateConflict(
        'clinic_2',  // Different clinic
        new Date('2026-02-20T14:00:00Z'),
        new Date('2026-02-20T15:00:00Z')
      );
      expect(result).toBeNull();  // No conflict
    });
  });
});
```

---

## 🔒 Implicações de Segurança

### Multi-tenant Enforcement

```sql
-- Constraint garante isolamento por clinicId
ALTER TABLE "Schedule" 
ADD CONSTRAINT "schedule_no_overlap" 
EXCLUDE USING gist (
  "clinicId" WITH =,    ← "Mesma clínica?"
  tsrange(...) WITH &&
);

-- Resultado: clínica_A não pode conflitar com clínica_B
-- (mesmo que tenham mesmo horário)
```

---

## 📈 Performance

### Índices para Layer 1

```sql
-- Query validateConflict() precisa desses índices
CREATE INDEX idx_schedule_clinic_status_time 
ON "Schedule" ("clinicId", "status", "startTime", "endTime");

-- Query: ~50ms
SELECT * FROM "Schedule" 
WHERE "clinicId" = $1 
  AND "status" != 'canceled' 
  AND "startTime" < $2 
  AND "endTime" > $3 
LIMIT 1;
```

### Constraint Performance

- EXCLUDE constraint usa GiST index (automático)
- Overhead: ~5-10ms por INSERT (negligenciável)
- Tradeoff: 5ms mais lento para segurança garantida ✅

---

## 🚀 Checklist de Implementação

- [x] btree_gist extension habilitada
- [x] EXCLUDE constraint criada
- [x] validateConflict() service implementado
- [x] validateConflict() chamada em POST /api/schedules
- [x] validateConflict() chamada em PATCH /api/schedules (remarcar)
- [x] BDD tests (7 scenarios)
- [x] Jest tests (validateConflict)
- [x] Índices de performance criados
- [x] Multi-tenant isolamento testado

---

**Status:** ✅ IMPLEMENTADO (Semana 1)  
**Impacto:** Crítico — Integridade de dados  
**Custo:** Mínimo — 2 layers são complementares, não redundantes
