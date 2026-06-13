import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()
type AuthReq = FastifyRequest & { clinicId: string; userId: string }

export default async function clinicRoute(app: FastifyInstance) {
  app.get('/api/clinic', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const clinic = await prisma.clinic.findUnique({ where: { id: r.clinicId } })
    if (!clinic) return reply.code(404).send({ error: 'Clínica não encontrada.' })
    return reply.send(clinic)
  })

  app.patch<{ Body: { name?: string; phone?: string } }>(
    '/api/clinic',
    { preHandler: verifyToken },
    async (req, reply) => {
      const r = req as AuthReq
      const { name, phone } = req.body as { name?: string; phone?: string }
      const clinic = await prisma.clinic.update({
        where: { id: r.clinicId },
        data: {
          ...(name  ? { name }  : {}),
          ...(phone ? { phone } : {}),
        },
      })
      return reply.send(clinic)
    },
  )
}
