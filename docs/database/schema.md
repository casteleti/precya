# Schema do Banco

Ver `app/backend/prisma/schema.prisma` para o schema completo.

## Entidades Principais
- **Clinic** — tenant raiz
- **User** — profissionais da clínica (roles: owner, therapist, receptionist)
- **Client** — pacientes/clientes com status automático
- **Schedule** — agendamentos com confirmação WhatsApp
- **Protocol** — tratamentos com métricas de sucesso
- **SessionFeedback** — avaliação pós-sessão (1-5)
- **AnamnesisResponse** — histórico versionado de anamnese

## Status de Clientes
- `ativo` — sessão recente
- `risco` — sem sessão há X dias (threshold configurável)
- `inativo` — sem sessão há muito tempo

## Status de Agendamentos
- `not_confirmed` → `confirmed` → `completed`
- `not_confirmed` → `cancelled`
