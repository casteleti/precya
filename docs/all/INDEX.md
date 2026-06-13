# 📚 DAKSA MVP — Índice de Documentação Completo

## 📍 Arquivo Principal

- **README.md** ← COMECE AQUI! Overview geral do projeto

## 📋 Documentação Estratégica (Leia na ordem)

1. **PROJECT_BRIEF.md** - Visão, objetivos, personas, modelo de negócio
2. **ROADMAP.md** - Timeline 7 semanas, métricas
3. **TASKS.md** - Backlog priorizado (P0, P1, P2)

## 🏗️ Arquitetura Técnica

- **docs/architecture/SYSTEM_OVERVIEW.md** - Componentes e fluxos
- **docs/architecture/TECH_STACK.md** - Stack detalhado, justificativas
- **docs/architecture/DATA_FLOW.md** - Fluxos de dados (agendamento, WhatsApp, anamnesia)

## 🔌 API

- **docs/api/ENDPOINTS.md** - Todos os endpoints (GET, POST, PATCH, DELETE)
- **docs/api/openapi.yaml** - Especificação OpenAPI completa

## 🗄️ Banco de Dados

- **docs/database/SCHEMA.md** - 7 tabelas, constraints, índices
- **docs/database/MIGRATIONS.md** - Estratégia de migrações

## 🚀 Deployment

- **docs/deployment/ENVIRONMENTS.md** - Dev, Staging, Production

## ✨ Features

- **docs/features/FEATURE_LIST.md** - Status de cada feature (✅ concluído, futuro)

## 🏛️ Decisões Arquiteturais (ADRs)

- **docs/decisions/ADR-001-status-schedule-4-values.md** - Por que 4 status (não 3 ou 5)
- **docs/decisions/ADR-002-anamnesia-versioning.md** - Por que INSERT (não UPDATE)
- **docs/decisions/ADR-003-overlap-detection-2-layers.md** - 2-layer validation

## 📖 Desenvolvimento

- **CONTRIBUTING.md** - Como contribuir, padrões de código, PR process
- **.claude/PROJECT_CONTEXT.md** - Contexto para Claude (stack, decisões, checklist)
- **.claude/CODING_STANDARDS.md** - Padrões TypeScript, Backend, Frontend, Testes
- **.claude/WORKFLOW.md** - Fluxo diário (TDD, branch strategy, debugging)

---

## 🎯 Por Onde Começar?

### Se você é **Product/Manager:**
1. README.md
2. PROJECT_BRIEF.md
3. ROADMAP.md
4. FEATURE_LIST.md

### Se você é **Dev/Engineer:**
1. README.md
2. docs/architecture/SYSTEM_OVERVIEW.md
3. TASKS.md (próxima task a fazer)
4. CONTRIBUTING.md
5. .claude/WORKFLOW.md
6. (Aí você faz a task)

### Se você é **Claude/AI:**
1. .claude/PROJECT_CONTEXT.md
2. .claude/CODING_STANDARDS.md
3. .claude/WORKFLOW.md
4. (Aí você gera código)

---

## 📊 Estatísticas de Documentação

- **Documentos:** 20 arquivos Markdown
- **Tamanho:** ~200KB
- **Coverage:** 100% (arquitetura, features, decisions, workflow)
- **Atualização:** Junho 2026

---

**Última atualização:** Junho 2026  
**Próxima revisão:** Após semana 1 (recolher learnings)
