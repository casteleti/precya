# CODING_STANDARDS.md — Padrões de Código DAKSA

**Versão:** 1.0  
**Escopo:** Projeto inteiro (Frontend + Backend)  
**Enforcement:** Lint + código review + testes

---

## 📏 Regras Universais

### 1. TypeScript Strict

**Config:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Regra:** Não use `any`. Se necessário, justifique com `// @ts-ignore` + comentário.

```typescript
// ✅ BPOM
function calculatePrice(item: Schedule): number {
  return item.price || 0;
}

// ❌ EVITAR
function calculatePrice(item: any): any {
  return item.price || 0;
}
```

### 2. Sem console.log

**Use logger (Pino):**

```typescript
// ✅ BOM
import { logger } from './logger';
logger.info('Schedule criado', { scheduleId, clinicId });
logger.error('Validação falhou', { error, input });
logger.warn('Retry após falha', { attempt: 3 });
logger.debug('SQL query executada', { query, duration: '45ms' });

// ❌ EVITAR
console.log('ok');
console.error('error');
```

### 3. Nomes Descritivos

```typescript
// ✅ BOM
const validateConflictingSchedule = (existing, proposed) => {...};
const isClientAtRisk = (client) => {...};
const sendWhatsappConfirmation = (schedule) => {...};
const calculateSuccessRate = (protocol) => {...};

// ❌ EVITAR
const v = (...args) => {...};
const check = (...args) => {...};
const validate = (...args) => {...};
const x = 5;
const y = `client_${id}`;
```

### 4. Funções Pequenas

**Regra:** Máximo 30 linhas de código por função.

```typescript
// ✅ BOM (15 linhas)
async function createSchedule(input: CreateScheduleInput) {
  const validated = createScheduleSchema.parse(input);
  const conflict = await validateConflict(validated.clinicId, validated.startTime, validated.endTime);
  if (conflict) {
    throw new ConflictError('SCHEDULE_CONFLICT');
  }
  const schedule = await prisma.schedule.create({ data: validated });
  await dispatchN8NJob('schedule-created', { scheduleId: schedule.id });
  return schedule;
}

// ❌ EVITAR (50+ linhas)
async function createSchedule(input) {
  // validação inline
  if (!input.clinicId) throw new Error('...');
  if (!input.clientId) throw new Error('...');
  // busca conflito
  const existing = await prisma.schedule.findMany({...});
  if (existing.length > 0) {...}
  // cria schedule
  const schedule = await prisma.schedule.create({...});
  // busca cliente
  const client = await prisma.client.findUnique({...});
  // atualiza cliente
  await prisma.client.update({...});
  // dispatch job
  await fetch('https://n8n...', {...});
  // log
  console.log('done');
  return schedule;
}
```

### 5. Sem Duplicação (DRY)

```typescript
// ❌ RUIM (duplicado)
const therapistErrorMessage = 'Therapist not found';
const clientErrorMessage = 'Client not found';

// ✅ BOM (abstrato)
const getEntityNotFoundMessage = (entity: string) => `${entity} not found`;
```

---

## 🔙 Backend Standards (Fastify + Prisma)

### Estrutura de Pasta

```
app/backend/
├── src/
│   ├── routes/
│   │   ├── schedule.routes.ts
│   │   ├── client.routes.ts
│   │   ├── protocol.routes.ts
│   │   └── auth.routes.ts
│   │
│   ├── services/
│   │   ├── scheduleService.ts
│   │   ├── clientService.ts
│   │   ├── protocolService.ts
│   │   └── authService.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   │
│   ├── types/
│   │   ├── schedule.types.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── validators.ts
│   │   └── logger.ts
│   │
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── tests/
    ├── schedule.test.ts
    └── features/
        └── schedule.feature
```

### Route Definition

```typescript
// ✅ BOM
export async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateScheduleInput }>(
    '/schedules',
    {
      schema: {
        description: 'Criar novo agendamento',
        body: createScheduleSchema
      }
    },
    async (request, reply) => {
      const schedule = await scheduleService.createSchedule(request.body, request.user.clinicId);
      return reply.code(201).send(schedule);
    }
  );
}

// ❌ EVITAR (sem schema, sem tipos)
app.post('/schedules', (req, res) => {
  const schedule = ScheduleService.createSchedule(req.body);
  res.send(schedule);
});
```

### Service Pattern

```typescript
// ✅ BOM
export class ScheduleService {
  constructor(private prisma: PrismaClient) {}

  async createSchedule(
    input: CreateScheduleInput,
    clinicId: string
  ): Promise<Schedule> {
    // 1. Validação
    const validated = createScheduleSchema.parse(input);
    
    // 2. Verificações negócio
    const conflict = await this.validateConflict(
      clinicId,
      validated.startTime,
      validated.endTime
    );
    if (conflict) {
      throw new ConflictError('SCHEDULE_CONFLICT', { conflictId: conflict.id });
    }
    
    // 3. Persistência
    const schedule = await this.prisma.schedule.create({
      data: {
        ...validated,
        clinicId
      }
    });
    
    // 4. Side effects
    await this.dispatchN8NJob('schedule-created', { scheduleId: schedule.id });
    
    return schedule;
  }

  private async validateConflict(
    clinicId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Schedule | null> {
    return this.prisma.schedule.findFirst({
      where: {
        clinicId,
        status: { not: 'canceled' },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      }
    });
  }
}
```

### Error Handling

```typescript
// ✅ BOM
class ApplicationError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

class ConflictError extends ApplicationError {
  constructor(code: string, details?: Record<string, any>) {
    super(code, 409, 'Resource conflict', details);
  }
}

// Usage
if (conflict) {
  throw new ConflictError('SCHEDULE_CONFLICT', {
    conflictingScheduleId: conflict.id
  });
}

// ❌ EVITAR
throw new Error('error');
throw new Error('schedule conflict');
```

### Validação com Zod

```typescript
// ✅ BOM
import { z } from 'zod';

export const createScheduleSchema = z.object({
  clinicId: z.string().cuid(),
  clientId: z.string().cuid(),
  serviceId: z.string().min(1),
  startTime: z.date().min(new Date()),
  duration: z.number().int().min(15),
  notes: z.string().optional()
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

// Usage
const validated = createScheduleSchema.parse(input);
// se falhar → ZodError com mensagens claras

// ❌ EVITAR
if (!input.clinicId) throw new Error('...');
if (!input.clientId) throw new Error('...');
if (input.duration < 15) throw new Error('...');
```

---

## 🎨 Frontend Standards (Next.js + React)

### Estrutura de Pasta

```
app/frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── signin/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── agenda/
│   │   │   ├── clientes/
│   │   │   └── protocolos/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Card.tsx
│   │   ├── dashboard/
│   │   │   ├── ScheduleGrid.tsx
│   │   │   └── ClientList.tsx
│   │   └── forms/
│   │       ├── CreateScheduleForm.tsx
│   │       └── CreateClientForm.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   └── utils.ts
│   │
│   └── styles/
│       └── globals.css
```

### Component Pattern

```typescript
// ✅ BOM
'use client';

import { FC, useState } from 'react';
import { Button } from '@/components/common/Button';

interface ScheduleGridProps {
  clinicId: string;
  onScheduleSelect: (id: string) => void;
}

export const ScheduleGrid: FC<ScheduleGridProps> = ({
  clinicId,
  onScheduleSelect
}) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateSchedule = async (data) => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const newSchedule = await response.json();
        setSchedules([...schedules, newSchedule]);
      }
    } catch (error) {
      console.error('Failed to create schedule', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-7 gap-4">
      {schedules.map(schedule => (
        <Button
          key={schedule.id}
          onClick={() => onScheduleSelect(schedule.id)}
        >
          {schedule.startTime}
        </Button>
      ))}
    </div>
  );
};
```

### Hooks Pattern

```typescript
// ✅ BOM
import { useState, useCallback } from 'react';

export function useSchedules(clinicId: string) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schedules?clinicId=${clinicId}`);
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  return { schedules, loading, error, fetch };
}
```

---

## 🧪 Testing Standards

### BDD (Gherkin)

```gherkin
Feature: Criar Agendamento

  Background:
    Given clínica logada com id "clinic_1"
    And cliente existente "client_1"

  Scenario: Criar agendamento sem conflito
    When POST /api/schedules {
      | clientId   | client_1                |
      | startTime  | 2026-02-20T14:00:00Z    |
      | duration   | 60                      |
    }
    Then status code = 201
    And response.status = "not_confirmed"
    And response.whatsappSent = false

  Scenario: Validar overlap
    Given agendamento existente "14:00-15:00"
    When POST /api/schedules { startTime: 14:30, duration: 60 }
    Then status code = 409
    And response.code = "SCHEDULE_CONFLICT"
```

### Jest

```typescript
// ✅ BOM
describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    service = new ScheduleService(prisma);
    await prisma.schedule.deleteMany(); // Clean slate
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('createSchedule', () => {
    it('should create schedule without conflict', async () => {
      const result = await service.createSchedule(
        {
          clientId: 'client_1',
          serviceId: 'service_1',
          startTime: new Date('2026-02-20T14:00:00Z'),
          duration: 60
        },
        'clinic_1'
      );

      expect(result.id).toBeDefined();
      expect(result.status).toBe('not_confirmed');
    });

    it('should throw ConflictError on overlap', async () => {
      // Create existing
      await prisma.schedule.create({
        data: {
          clinicId: 'clinic_1',
          clientId: 'client_1',
          startTime: new Date('2026-02-20T14:00:00Z'),
          endTime: new Date('2026-02-20T15:00:00Z'),
          status: 'confirmed'
        }
      });

      // Attempt overlap
      expect(
        service.createSchedule(
          {
            clientId: 'client_2',
            serviceId: 'service_1',
            startTime: new Date('2026-02-20T14:30:00Z'),
            duration: 60
          },
          'clinic_1'
        )
      ).rejects.toThrow(ConflictError);
    });
  });
});
```

---

## 📋 Code Review Checklist

### Backend

- [ ] TypeScript strict, sem `any`
- [ ] Zod validation em inputs
- [ ] WHERE clinicId em toda query
- [ ] Error classes customizadas
- [ ] Logging em decisões críticas
- [ ] Sem console.log
- [ ] Testes (BDD + Jest)
- [ ] < 30 linhas por função

### Frontend

- [ ] React.FC com tipos
- [ ] Hooks customizados extraídos
- [ ] Tailwind classes (não inline styles)
- [ ] Loading e error states
- [ ] Acessibilidade (alt, aria-label)
- [ ] Sem console.log
- [ ] PropTypes ou TypeScript types

### Banco de Dados

- [ ] Constraint CHECK explícitos
- [ ] Índices para performance
- [ ] FK relationships corretas
- [ ] UNIQUE (clinicId, ...) para multi-tenant
- [ ] Comentários em estruturas complexas

---

## 🚀 Lint Config

### ESLint

```js
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals'
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error'
  }
};
```

### Prettier

```js
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 100
};
```

---

**Última atualização:** Junho 2026  
**Enforcement:** CI/CD + code review
