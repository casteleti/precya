import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function publicRoute(app: FastifyInstance) {
  // Get session info by confirm token (no auth)
  app.get('/public/confirm/:token', async (req, reply) => {
    const { token } = req.params as { token: string }
    const schedule = await prisma.schedule.findUnique({
      where: { confirmToken: token },
      include: {
        client: { select: { name: true } },
        clinic: { select: { name: true, phone: true } },
      },
    })
    if (!schedule) return reply.code(404).send({ error: 'Link inválido ou expirado.' })
    return reply.send({
      id: schedule.id,
      status: schedule.status,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      clientName: schedule.client.name,
      clinicName: schedule.clinic.name,
      clinicPhone: schedule.clinic.phone,
    })
  })

  // Confirm session by token (no auth)
  app.post('/public/confirm/:token', async (req, reply) => {
    const { token } = req.params as { token: string }
    const schedule = await prisma.schedule.findUnique({ where: { confirmToken: token } })
    if (!schedule) return reply.code(404).send({ error: 'Link inválido ou expirado.' })
    if (schedule.status === 'cancelled') return reply.code(400).send({ error: 'Sessão cancelada.' })
    if (schedule.status === 'completed') return reply.code(400).send({ error: 'Sessão já concluída.' })
    await prisma.schedule.update({
      where: { id: schedule.id },
      data: { status: 'confirmed' },
    })
    return reply.send({ ok: true })
  })
}
