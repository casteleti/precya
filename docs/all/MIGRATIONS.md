# Migrations — DAKSA MVP

## 001_init

Cria as 7 tabelas:
- Clinic, User, Client, Schedule, SessionFeedback, Protocol, AnamnesisResponse
- Constraints (CHECK, UNIQUE, FK)
- EXCLUDE constraint para overlap detection
- Extensão btree_gist

**Status:** Implementada (Semana 1)

## Próximas (Futuro)

- 002_add_audit_log (compliance)
- 003_add_email_preferences
- 004_add_google_calendar_config

---

**Última atualização:** Junho 2026
