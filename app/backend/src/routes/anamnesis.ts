import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()
type AuthReq = FastifyRequest & { clinicId: string; userId: string }

const TEMPLATE_ID = 'default-v1'

export default async function anamnesisRoute(app: FastifyInstance) {
  // GET latest anamnesis for a client
  app.get('/api/clients/:clientId/anamnesis', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { clientId } = req.params as { clientId: string }

    const client = await prisma.client.findFirst({ where: { id: clientId, clinicId: r.clinicId } })
    if (!client) return reply.code(404).send({ error: 'Cliente não encontrado.' })

    const anamnesis = await prisma.anamnesisResponse.findFirst({
      where: { clientId, clinicId: r.clinicId },
      orderBy: { version: 'desc' },
    })

    return reply.send(anamnesis ?? null)
  })

  // POST — create or update anamnesis
  app.post<{ Params: { clientId: string }; Body: { responses: Record<string, string> } }>(
    '/api/clients/:clientId/anamnesis',
    { preHandler: verifyToken },
    async (req, reply) => {
      const r = req as AuthReq
      const { clientId } = req.params as { clientId: string }
      const { responses } = req.body as { responses: Record<string, string> }

      const client = await prisma.client.findFirst({ where: { id: clientId, clinicId: r.clinicId } })
      if (!client) return reply.code(404).send({ error: 'Cliente não encontrado.' })

      const existing = await prisma.anamnesisResponse.findFirst({
        where: { clientId, clinicId: r.clinicId },
        orderBy: { version: 'desc' },
      })

      if (existing) {
        const updated = await prisma.anamnesisResponse.update({
          where: { id: existing.id },
          data: { responses },
        })
        return reply.send(updated)
      }

      const created = await prisma.anamnesisResponse.create({
        data: {
          clinicId: r.clinicId,
          clientId,
          templateId: TEMPLATE_ID,
          responses,
          version: 1,
        },
      })
      return reply.code(201).send(created)
    },
  )
}
