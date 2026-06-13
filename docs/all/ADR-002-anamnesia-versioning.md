# ADR-002: Anamnesia Versionada — INSERT (não UPDATE)

**Status:** ACCEPTED  
**Decided:** Junho 2026  
**Deciders:** Ricardo (Product/Tech Lead)  

---

## 📋 Problema

Como armazenar anamnesia de cliente para manter histórico?

**Opções consideradas:**
1. Campo único, UPDATE a cada mudança (sobrescreve)
2. INSERT nova versão, preservar histórico
3. Tabela separada de "AnamnesisVersion" com FK
4. JSONB array com histórico embutido

---

## 🎯 Decisão

**Adotar INSERT (não UPDATE) com versionamento por cliente:**

```sql
-- Tabela
CREATE TABLE "AnamnesisResponse" (
  "id" CUID PRIMARY KEY,
  "clientId" CUID NOT NULL FK,
  "version" INT NOT NULL DEFAULT 1,
  "responses" JSONB NOT NULL,
  "createdAt" TIMESTAMP,
  UNIQUE ("clientId", "version")  ← Múltiplas versões por cliente
);

-- Nunca: UPDATE AnamnesisResponse SET responses = ...
-- Sempre: INSERT novo registro com version+1
```

---

## 🤔 Justificativa

### Por que não sobrescrever (UPDATE)?

❌ **UPDATE (sobrescreve):**
```sql
UPDATE AnamnesisResponse SET responses = {...} WHERE clientId = $1;
```

**Problemas:**
- Histórico perdido (você não sabe como era antes)
- Impossível saber quando mudou
- Auditoria comprometida
- Legalmente duvidoso (compliance)
- Impossível comparar mudanças

### Por que não tabela separada de versões?

❌ **Tabela "AnamnesisVersion" separada:**
```sql
-- Tabela de versões com FK
CREATE TABLE "AnamnesisVersion" (
  version INT,
  clientId CUID,
  responses JSONB
);
```

**Problemas:**
- Complexidade extra (JOINs)
- N+1 queries ao carregar histórico
- Denormalização é melhor para anamnesía

### Por que não JSONB array?

❌ **Array de versões embutido:**
```json
{
  "clientId": "...",
  "versions": [
    { "v": 1, "responses": {...} },
    { "v": 2, "responses": {...} }
  ]
}
```

**Problemas:**
- Pesquisa por versão ineficiente (scan array)
- UPDATE do array inteiro é custoso
- Locking em concurrent updates
- Impossível indexar versão

### Por que exatamente INSERT com UNIQUE(clientId, version)?

✅ **INSERT novo registro:**

```sql
-- Semana 1: Cliente preencheu anamnesia
INSERT INTO AnamnesisResponse (clientId, version, responses)
VALUES ('client_1', 1, {...});

-- Semana 3: Cliente retorna, algumas coisas mudaram
INSERT INTO AnamnesisResponse (clientId, version, responses)
VALUES ('client_1', 2, {...});

-- Query última versão (eficiente!)
SELECT * FROM AnamnesisResponse 
WHERE clientId = 'client_1' 
ORDER BY version DESC 
LIMIT 1;

-- Query histórico (eficiente!)
SELECT * FROM AnamnesisResponse 
WHERE clientId = 'client_1' 
ORDER BY version ASC;
```

**Benefícios:**
1. **Histórico preservado** — Nunca perde dados
2. **Auditoria** — Timestamp de cada versão
3. **Performance** — Índice em (clientId, version)
4. **Facilita compliance** — LGPD, HIPAA (clínicas)
5. **Comparação** — Terapeuta vê o que mudou
6. **Reversão** — Pode "voltar" a versão anterior se necessário
7. **Simples** — Sem UPDATE locks

---

## 📊 Data Flow

### Primeira Anamnesia

```
PUT /api/clients/:id/anamnesis
{
  "responses": {
    "alergias": "Penicilina",
    "medicamentos": "Fluoxetina",
    "queixa": "Ansiedade"
  }
}
    ↓
Backend:
  1. Query versão atual: SELECT version FROM ... ORDER BY version DESC LIMIT 1
     → Result: null (não existe ainda)
  2. Calcular nextVersion = (null ?? 0) + 1 = 1
  3. INSERT:
     INSERT INTO AnamnesisResponse (clientId, version, responses)
     VALUES ('client_1', 1, {...})
    ↓
Response 200:
{
  "id": "ares_001",
  "version": 1,
  "responses": {...},
  "createdAt": "2026-01-15T10:00:00Z"
}
    ↓
Database state:
AnamnesisResponse { clientId: 'client_1', version: 1, ... }
```

### Atualizar Anamnesia (2 Semanas Depois)

```
PUT /api/clients/:id/anamnesia
{
  "responses": {
    "alergias": "Penicilina, Aspirina",  ← MUDOU
    "medicamentos": "Fluoxetina, Losartana",  ← MUDOU
    "queixa": "Ansiedade e insônia"  ← MUDOU
  }
}
    ↓
Backend:
  1. Query versão atual:
     SELECT version FROM AnamnesisResponse 
     WHERE clientId = 'client_1' 
     ORDER BY version DESC LIMIT 1
     → Result: version = 1
  2. Calcular nextVersion = 1 + 1 = 2
  3. INSERT (não UPDATE!):
     INSERT INTO AnamnesisResponse (clientId, version, responses)
     VALUES ('client_1', 2, {...})
  4. Constraint UNIQUE(clientId, version) permite isso
     (porque v1 ≠ v2)
    ↓
Response 200:
{
  "id": "ares_002",
  "version": 2,
  "responses": {...},
  "createdAt": "2026-02-10T09:00:00Z"
}
    ↓
Database state:
AnamnesisResponse { clientId: 'client_1', version: 1, ... }  ← Ainda existe!
AnamnesisResponse { clientId: 'client_1', version: 2, ... }  ← Novo
```

### Query Última Versão (para GET /clients/:id)

```javascript
// Query
const anamnesis = await prisma.anamnesisResponse.findFirst({
  where: { clientId },
  orderBy: { version: 'desc' }
});

// SQL gerado
SELECT * FROM AnamnesisResponse 
WHERE clientId = 'client_1' 
ORDER BY version DESC 
LIMIT 1;

// Result: version 2 (a mais recente)
```

### Query Histórico (para timeline visual)

```javascript
// Query
const history = await prisma.anamnesisResponse.findMany({
  where: { clientId },
  orderBy: { version: 'asc' }
});

// Result:
[
  { version: 1, createdAt: '2026-01-15T10:00:00Z', ... },
  { version: 2, createdAt: '2026-02-10T09:00:00Z', ... }
]

// UI mostra:
// v1 (15/01)  →  v2 (10/02)
// [atualizar] [atualizar]
```

---

## 🗄️ Schema Prisma

```prisma
model AnamnesisResponse {
  id        String   @id @default(cuid())
  
  clinicId  String   // Multi-tenant
  client    Client   @relation(fields: [clientId], references: [id])
  clientId  String
  
  version   Int      @default(1)
  responses Json     @default("{}")
  
  createdAt DateTime @default(now())
  
  // Constraint: múltiplas versões por cliente, mas UNIQUE por (client, version)
  @@unique([clientId, version])
  @@index([clientId, version(sort: Desc)])
}
```

---

## 🔄 Lógica de Versionamento (Service)

```typescript
// app/backend/src/services/anamnesisService.ts

async function updateAnamnesis(
  clientId: string,
  responses: Record<string, any>
): Promise<AnamnesisResponse> {
  // 1. Query versão ATUAL (máxima)
  const currentVersion = await prisma.anamnesisResponse.findFirst({
    where: { clientId },
    orderBy: { version: 'desc' }
  });
  
  // 2. Calcular PRÓXIMA versão
  const nextVersion = (currentVersion?.version ?? 0) + 1;
  
  // 3. INSERT nova versão (não UPDATE!)
  const newAnamnesis = await prisma.anamnesisResponse.create({
    data: {
      clientId,
      version: nextVersion,
      responses
    }
  });
  
  return newAnamnesis;
}
```

---

## 🧪 Testes

### BDD

```gherkin
Feature: Anamnesia Versionada

  Scenario: Primeira anamnesia cria v1
    Given cliente novo sem anamnesia
    When PUT /clients/:id/anamnesia { responses: {...} }
    Then status 200
    And response.version = 1
    And DB tem 1 registro AnamnesisResponse

  Scenario: Atualizar cria v2, preserva v1
    Given anamnesia v1 existente
    When PUT /clients/:id/anamnesia { responses: {...alterado} }
    Then status 200
    And response.version = 2
    And DB tem 2 registros (v1 e v2)
    And v1 intacto (SELECT ... version = 1 retorna dados originais)

  Scenario: GET ultima versao sempre retorna max
    Given versoes: 1, 2, 3
    When GET /clients/:id
    Then response.anamnesis.version = 3
    And query usa ORDER BY version DESC LIMIT 1

  Scenario: Timeline mostra historico
    Given versoes: 1 (01/01), 2 (02/01), 3 (03/01)
    When GET /clients/:id/anamnesis/history
    Then retorna array [v1, v2, v3]
    And pode clicar em cada version para ver snapshot
```

### Jest

```typescript
describe('AnamnesisService', () => {
  describe('updateAnamnesis', () => {
    it('should create version 1 for new client', async () => {
      const result = await anamnesisService.updateAnamnesis('client_1', {...});
      expect(result.version).toBe(1);
    });

    it('should create version 2 and preserve version 1', async () => {
      // Create v1
      const v1 = await anamnesisService.updateAnamnesis('client_1', {old: 'data'});
      expect(v1.version).toBe(1);
      
      // Create v2
      const v2 = await anamnesisService.updateAnamnesia('client_1', {new: 'data'});
      expect(v2.version).toBe(2);
      
      // Verify v1 still exists
      const preserved = await prisma.anamnesisResponse.findFirst({
        where: { clientId: 'client_1', version: 1 }
      });
      expect(preserved).toBeDefined();
    });

    it('should query latest version correctly', async () => {
      // Create v1, v2, v3
      for (let i = 1; i <= 3; i++) {
        await anamnesisService.updateAnamnesis('client_1', {v: i});
      }
      
      // Query latest
      const latest = await prisma.anamnesisResponse.findFirst({
        where: { clientId: 'client_1' },
        orderBy: { version: 'desc' }
      });
      
      expect(latest.version).toBe(3);
    });
  });
});
```

---

## 🔒 Implicações de Segurança

### Multi-tenant

```typescript
// ✅ SEGURO: Sempre filtrar por clinicId
const anamnesis = await prisma.anamnesisResponse.findFirst({
  where: {
    clientId,
    client: { clinicId: request.user.clinicId }  // Enforce
  }
});

// ❌ INSEGURO: Sem filtro de clinicId
const anamnesis = await prisma.anamnesisResponse.findFirst({
  where: { clientId }  // Expõe dados de outras clínicas!
});
```

### Imutabilidade de Versões

```typescript
// ❌ NUNCA: Editar versão antiga
UPDATE AnamnesisResponse SET responses = {...} WHERE version = 1;

// ✅ SIM: Criar nova versão se mudança
INSERT INTO AnamnesisResponse (clientId, version, responses) VALUES (...);
```

---

## 📈 Performance

### Índices

```sql
CREATE INDEX idx_anamnesis_client_version 
ON AnamnesisResponse(clientId, version DESC);

-- Query última versão em ~1ms
SELECT * FROM AnamnesisResponse 
WHERE clientId = $1 
ORDER BY version DESC 
LIMIT 1;
```

### Crescimento de Dados

Cliente com 1 atualização/mês por 5 anos:
- Registros: 1 (v1) + 60 (v2-v61) = 61 registros
- Espaço: ~61 × 2KB = ~122KB por cliente
- 1000 clientes: ~122MB (negligenciável)

---

## 🚀 Checklist de Implementação

- [x] Schema Prisma com UNIQUE(clientId, version)
- [x] Migration criada (001_init)
- [x] Service updateAnamnesis() implementado
- [x] Query última versão otimizada
- [x] Query histórico implementado
- [x] BDD tests (4 scenarios)
- [x] Jest tests (versionamento)
- [x] Multi-tenant enforcement

---

**Status:** ✅ IMPLEMENTADO (Semana 1)  
**Impacto:** Alto — Clínicas precisam de histórico para compliance  
**Custo:** Mínimo — INSERT é mais barato que UPDATE + logging
