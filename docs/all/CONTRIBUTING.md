# Guia de Contribuição — DAKSA MVP

## 🚀 Quick Start

```bash
git clone https://github.com/seu-repo/daksa-mvp.git
cd daksa-mvp
npm install
docker-compose up -d
npm run dev
```

## ✍️ Padrões de Código

### TypeScript Strict
- Sem `any`
- Nomes descritivos
- Máximo 30 linhas por função
- Sem duplicação (DRY)

### Validação
- Zod schemas em toda input
- Whitelist (não blacklist)

### Multi-tenant
```typescript
// ✅ CORRETO
WHERE clinicId = request.user.clinicId

// ❌ INSEGURO
WHERE id = ...  // Expõe dados!
```

## 🧪 Testes

**Obrigatório:**
1. BDD (Gherkin) scenarios
2. Jest unit tests
3. Coverage > 80%

```bash
npm test          # Ambos
npm run test:bdd  # Só Cucumber
```

## 📝 Commits

```
feat(schedule): add overlap detection
fix(auth): correct JWT validation
docs(api): update endpoints
test(schedule): add edge cases
```

## 🔀 PR Process

1. Branch: `feature/nome`
2. Testes passam
3. Lint OK
4. 1 approval
5. Merge

---

**Última atualização:** Junho 2026
