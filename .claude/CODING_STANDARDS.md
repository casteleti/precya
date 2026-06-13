# Padrões de Código — PRECYA

## TypeScript
- Strict mode sempre
- Sem `any` explícito — use `unknown` e faça type guard
- Tipos em `src/types/index.ts` (backend) ou junto ao componente (frontend)

## Backend (Fastify)
- Cada rota em arquivo separado em `src/routes/`
- Lógica de negócio em `src/services/`
- Sempre validar `clinicId` do token JWT antes de qualquer query
- Retornar `{ data }` em sucesso, `{ error }` em falha

## Frontend (Next.js)
- Server Components por padrão
- `'use client'` só quando necessário (forms, hooks)
- Fetch via `src/lib/api.ts`
- Componentes em `src/components/`

## Prisma
- Sempre incluir `clinicId` no `where`
- Usar `select` explícito (nunca retornar `passwordHash`)
- Migrations com nome descritivo: `npx prisma migrate dev --name add_field_x`

## Git
- Branch: `feature/nome`, `fix/nome`, `chore/nome`
- Commit: `feat:`, `fix:`, `chore:`, `docs:`
- PR → develop → main (nunca direto em main)
