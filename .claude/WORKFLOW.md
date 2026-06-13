# Workflow de Desenvolvimento — PRECYA

## Dia a Dia
1. `git checkout -b feature/nome`
2. `make dev` (sobe tudo)
3. Codifica
4. `make test` + `make lint`
5. PR → develop
6. CI passa → merge → deploy staging automático
7. Validar staging → deploy prod (manual no GitHub Actions)

## Setup Primeira Vez
```bash
cp .env.example .env
# Editar .env com credenciais reais
make setup
```

## Comandos Úteis
```bash
make dev          # sobe todos os containers
make test         # roda testes do backend
make lint         # lint frontend + backend
make backup       # backup do banco
make clean        # para e limpa tudo
```

## Ambientes
| Ambiente | Branch | URL | Deploy |
|----------|--------|-----|--------|
| Local | qualquer | localhost:5002 | manual |
| Staging | develop | staging.precya.com.br | automático (CI) |
| Prod | main | precya.com.br | manual (GitHub Actions) |

## Secrets GitHub (configurar em Settings → Secrets)
- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
- `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
