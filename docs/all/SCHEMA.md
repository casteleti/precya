# Database Schema — DAKSA MVP

## Tabelas (7 no total)

1. **Clinic** - Tenant
2. **User** - Therapist/Secretary/Admin
3. **Client** - Com status (ativo|risco|inativo)
4. **Schedule** - 4 status (not_confirmed|confirmed|completed|canceled)
5. **SessionFeedback** - Após sessão
6. **Protocol** - Rastreamento
7. **AnamnesisResponse** - Versionada (INSERT, não UPDATE)

## Constraints Críticas

```sql
-- Schedule: Previne overlap
EXCLUDE USING gist (clinicId WITH =, tsrange(start, end) WITH &&)

-- Client: Unique phone per clinic
UNIQUE (clinicId, phone)

-- Anamnesia: Versionada
UNIQUE (clientId, version)

-- Schedule: Status enum (4 valores)
CHECK (status IN ('not_confirmed', 'confirmed', 'completed', 'canceled'))
```

## Multi-tenant

**Regra:** WHERE clinicId = request.user.clinicId em TODA query

---

**Última atualização:** Junho 2026
