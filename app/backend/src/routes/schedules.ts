import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()

type AuthReq = FastifyRequest & { clinicId: string; userId: string }

export default async function schedulesRoute(app: FastifyInstance) {
  // List schedules (with optional date range)
  app.get('/api/schedules', { preHandler: verifyToken }, async (req) => {
    const r = req as AuthReq
    const { from, to, status, clientId } = req.query as Record<string, string>

    const where: Record<string, unknown> = { clinicId: r.clinicId }
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (from || to) {
      where.startTime = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        client: { select: { id: true, name: true, phone: true, status: true } },
      },
    })
    return schedules
  })

  // Get single schedule
  app.get('/api/schedules/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const schedule = await prisma.schedule.findFirst({
      where: { id, clinicId: r.clinicId },
      include: { client: { select: { id: true, name: true, phone: true } } },
    })
    if (!schedule) return reply.code(404).send({ error: 'Agendamento não encontrado.' })
    return schedule
  })

  // Create schedule
  app.post('/api/schedules', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const body = req.body as {
      clientId: string; startTime: string; endTime: string;
      price?: number; notes?: string; status?: string; protocolId?: string
    }

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, clinicId: r.clinicId },
    })
    if (!client) return reply.code(404).send({ error: 'Cliente não encontrado.' })

    const schedule = await prisma.schedule.create({
      data: {
        clinicId: r.clinicId,
        clientId: body.clientId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        price: body.price ?? null,
        notes: body.notes ?? null,
        status: body.status ?? 'not_confirmed',
        confirmToken: randomUUID(),
        ...(body.protocolId && { protocolId: body.protocolId }),
      },
      include: { client: { select: { id: true, name: true, phone: true } } },
    })
    return reply.code(201).send(schedule)
  })

  // Update schedule status
  app.patch('/api/schedules/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const body = req.body as {
      status?: string; notes?: string; price?: number;
      startTime?: string; endTime?: string
    }

    const schedule = await prisma.schedule.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!schedule) return reply.code(404).send({ error: 'Agendamento não encontrado.' })

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
      },
      include: { client: { select: { id: true, name: true, phone: true } } },
    })

    // Update client session stats on completion
    if (body.status === 'completed') {
      await prisma.client.update({
        where: { id: updated.clientId },
        data: {
          lastSessionDate: updated.startTime,
          sessionCount: { increment: 1 },
          ...(updated.price && { lifetimeValue: { increment: Number(updated.price) } }),
        },
      })
    }

    return updated
  })

  // Delete schedule
  app.delete('/api/schedules/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const schedule = await prisma.schedule.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!schedule) return reply.code(404).send({ error: 'Agendamento não encontrado.' })
    await prisma.schedule.delete({ where: { id } })
    return reply.code(204).send()
  })
}
