# Data Flow — DAKSA MVP

## Fluxo: Criar Agendamento

```
User → Modal → POST /api/schedules
  ↓
Layer 1: validateConflict() (código, rápido)
  ├─ SELECT * WHERE overlap
  └─ Se conflito → 409
  ↓
Layer 2: INSERT Schedule
  ├─ EXCLUDE constraint valida
  └─ Se overlap → DB rejeita
  ↓
Dispatch N8N job (24h confirmação)
  ↓
Response 201
```

## Fluxo: Confirmação WhatsApp

```
N8N Job (24h depois) → Twilio
  ↓
Cliente [Confirmar]/[Desmarcar]
  ↓
Webhook: POST /api/webhooks/whatsapp
  ├─ Validação assinatura
  ├─ UPDATE Schedule
  └─ Response 200
  ↓
Dashboard atualiza
```

---

**Última atualização:** Junho 2026
