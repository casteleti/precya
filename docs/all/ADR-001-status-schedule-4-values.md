# ADR-001: Schedule Status — 4 Valores (not_confirmed, confirmed, completed, canceled)

**Status:** ACCEPTED  
**Decided:** Junho 2026  
**Deciders:** Ricardo (Product/Tech Lead)  

---

## 📋 Problema

Qual deve ser o modelo de estados para um agendamento (Schedule)?

**Opções consideradas:**
1. 3 valores: `scheduled | completed | canceled`
2. 4 valores: `not_confirmed | confirmed | completed | canceled`
3. 5+ valores: `pending | confirmed | in_progress | completed | no_show | canceled`

---

## 🎯 Decisão

**Adotar 4 valores:**

```sql
CHECK (status IN (
  'not_confirmed',   -- Criado, aguardando confirmação WhatsApp
  'confirmed',       -- Confirmado pelo cliente
  'completed',       -- Sessão ocorreu, concluída
  'canceled'         -- Cancelado (por cliente ou terapeuta)
))
```

---

## 🤔 Justificativa

### Por que não 3 valores?

❌ **3 valores (`scheduled | completed | canceled`)**
- Não captura o conceito de "não confirmado"
- Cliente não confirma presença → sem dados de no-show
- Impossível diferenciar "confirmar no WhatsApp" do "marcar como completo"
- UX pior: sem feedback clara do cliente

### Por que não 5+?

❌ **5+ valores (`pending | confirmed | in_progress | ...`)**
- Complexidade desnecessária para MVP
- Mais states = mais transições = mais bugs
- Maior curva de aprendizado
- YAGNI principle

### Por que exatamente 4?

✅ **4 valores é o sweet spot:**
1. **not_confirmed** — Agendamento criado, job WhatsApp disparado (24h antes)
2. **confirmed** — Cliente clicou [Confirmar] no WhatsApp
3. **completed** — Sessão ocorreu e terapeuta marcou concluída
4. **canceled** — Cancelado (por cliente via WhatsApp ou terapeuta)

**Benefícios:**
- Captura o fluxo real de uma clínica
- Possibilita no-show detection (scheduled mas não confirmed no dia)
- Analytics preciso (completed ≠ confirmed)
- Simples o suficiente para MVP

---

## 📊 State Machine

```
┌──────────────────────────────────────────────────┐
│ SCHEDULE CREATION                                 │
│ status = "not_confirmed"                          │
│ whatsappSent = false                              │
│ whatsappConfirmed = false                         │
└──────────────────────┬───────────────────────────┘
                       ↓
            ┌──────────────────────┐
            │ N8N Job 24h antes    │
            │ whatsappSent = true  │
            │ status unchanged     │
            └──────────┬───────────┘
                       ↓
        ┌──────────────────────────────┐
        │ CLIENT RECEIVES WHATSAPP      │
        │ 2 options:                    │
        │ [Confirmar] [Desmarcar]       │
        └──────┬──────────────┬─────────┘
               ↓              ↓
        ┌─────────────┐   ┌──────────┐
        │ CONFIRMED   │   │ CANCELED │
        │ status→conf │   │ status→  │
        │ whatsappConf│   │ canceled │
        │ →true       │   └──────────┘
        └─────┬───────┘
              ↓
    ┌─────────────────────┐
    │ DAY OF SESSION      │
    │ Terapeuta marca     │
    │ "Sessão concluída"  │
    │ status → completed  │
    │ SessionFeedback     │
    │ criado              │
    └─────┬───────────────┘
          ↓
    ┌──────────────────┐
    │ COMPLETED        │
    │ Analytics update │
    │ Client updated   │
    └──────────────────┘
```

---

## 🔄 Transições Permitidas

| From | To | Condição | Endpoint |
|------|----|---------:|----------|
| not_confirmed | confirmed | Cliente WhatsApp | WEBHOOK |
| not_confirmed | canceled | Cliente/Terapeuta | DELETE ou WEBHOOK |
| confirmed | canceled | Terapeuta | DELETE |
| confirmed | completed | Terapeuta | POST /complete |
| not_confirmed | not_confirmed | Terapeuta remarcar | PATCH |
| confirmed | not_confirmed | (Não permitido) | ❌ |
| completed | * | (Não permitido) | ❌ |

---

## 💾 Banco de Dados

### Constraint

```sql
ALTER TABLE "Schedule" ADD CONSTRAINT schedule_status_check
CHECK ("status" IN ('not_confirmed', 'confirmed', 'completed', 'canceled'));
```

### Índices para Performance

```sql
-- Query comum: agendamentos confirmados hoje
CREATE INDEX idx_schedule_clinic_status_time 
ON "Schedule"("clinicId", "status", "startTime")
WHERE "status" IN ('confirmed', 'completed');

-- Query: detectar não-confirmados para reenvio
CREATE INDEX idx_schedule_not_confirmed 
ON "Schedule"("clinicId", "createdAt")
WHERE "status" = 'not_confirmed';
```

---

## 🧪 Testes

### BDD Scenarios

```gherkin
Feature: Schedule Status Transitions

  Scenario: Agendamento novo começa not_confirmed
    When POST /api/schedules
    Then response.status = "not_confirmed"
    And whatsappSent = false
    And whatsappConfirmed = false

  Scenario: Cliente confirma via WhatsApp
    Given schedule.status = "not_confirmed"
    When POST /api/webhooks/whatsapp { action: "confirm" }
    Then schedule.status = "confirmed"
    And whatsappConfirmed = true

  Scenario: Terapeuta marca como concluída
    Given schedule.status = "confirmed"
    When POST /api/schedules/:id/complete { rating: 5 }
    Then schedule.status = "completed"
    And SessionFeedback criado
    And status é imutável depois

  Scenario: Cancelamento só de not_confirmed/confirmed
    Given schedule.status = "completed"
    When DELETE /api/schedules/:id
    Then status 400
    And error "Cannot cancel completed schedule"
```

---

## 📈 Analytics Baseado em Status

```javascript
// Dashboard metrics
const schedulesCompletedThisWeek = 
  schedules.filter(s => s.status === 'completed' && thisWeek(s.startTime)).length;

const confirmationRate = 
  schedules.filter(s => s.status === 'confirmed' || s.status === 'completed').length 
  / 
  schedules.filter(s => s.status !== 'canceled').length;

const noShowRate = 
  schedules.filter(s => s.status === 'confirmed' && pastDate(s.startTime) && !feedback).length
  /
  schedules.filter(s => s.status === 'confirmed').length;
```

---

## 🔗 Relacionamentos

**Schedule.status → Decisões subsequentes:**
- `not_confirmed` → Não agenda recurso, não envia feedback email
- `confirmed` → Terapeuta preparar, analytics contar
- `completed` → Analytics +1, Session Feedback obrigatório
- `canceled` → Liberar slot, notificar via N8N, não contar em métricas

---

## 📋 Checklist de Implementação

- [x] Schema Prisma com CHECK constraint
- [x] Migration criada
- [x] API endpoints validam transições
- [x] BDD tests (6 scenarios)
- [x] Jest tests (validateStatus())
- [x] Documentation (aqui)
- [x] No-show detection logic preparado

---

## 🚀 Impacto

**Positivo:**
- ✅ Modela realidade (clínicas reais têm confirmação)
- ✅ Detecção de no-show
- ✅ Analytics preciso
- ✅ UX clara para cliente

**Custo:**
- 1 campo extra (whatsappConfirmed boolean)
- 1 webhook adicional
- Transições mais validadas

**ROI:** Muito alto — sem isso, clínicas não sabem quem vai comparecer.

---

**Revisado por:** —  
**Data de revisão:** —  
**Status:** ✅ IMPLEMENTADO (Semana 1)
