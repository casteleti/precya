# Arquitetura PRECYA

## Visão Geral

```
Browser → Next.js (5002) → Fastify API (5003) → PostgreSQL
                                               → Redis (cache/session)
```

## Serviços
| Serviço | Porta | Responsabilidade |
|---------|-------|-----------------|
| precya-web | 5002 | UI + NextAuth |
| precya-api | 5003 | REST API + regras de negócio |
| precya-postgres | 5432 | Dados persistentes |
| precya-redis | 6379 | Cache + sessões |

## Multi-tenancy
Isolamento por `clinicId` em todas as tabelas. Cada request autenticado
carrega `clinicId` no JWT e toda query filtra por ele.
