import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()

type AuthReq = FastifyRequest & { clinicId: string; userId: string }

export default async function protocolsRoute(app: FastifyInstance) {
  // List protocols with stats
  app.get('/api/protocols', { preHandler: verifyToken }, async (req) => {
    const r = req as AuthReq
    const protocols = await prisma.protocol.findMany({
      where: { clinicId: r.clinicId },
      orderBy: { name: 'asc' },
    })
    return protocols
  })

  // Get single protocol
  app.get('/api/protocols/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const protocol = await prisma.protocol.findFirst({
      where: { id, clinicId: r.clinicId },
    })
    if (!protocol) return reply.code(404).send({ error: 'Protocolo não encontrado.' })
    return protocol
  })

  // Create protocol
  app.post('/api/protocols', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const body = req.body as { name: string; description?: string; totalSessions?: number }
    if (!body.name?.trim()) return reply.code(400).send({ error: 'Nome obrigatório.' })

    const existing = await prisma.protocol.findFirst({
      where: { clinicId: r.clinicId, name: body.name.trim() },
    })
    if (existing) return reply.code(409).send({ error: 'Já existe um protocolo com este nome.' })

    const protocol = await prisma.protocol.create({
      data: {
        clinicId: r.clinicId,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        totalSessions: body.totalSessions ?? 0,
      },
    })
    return reply.code(201).send(protocol)
  })

  // Update protocol
  app.patch('/api/protocols/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const body = req.body as { name?: string; description?: string; totalSessions?: number }

    const protocol = await prisma.protocol.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!protocol) return reply.code(404).send({ error: 'Protocolo não encontrado.' })

    const updated = await prisma.protocol.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
        ...(body.totalSessions !== undefined && { totalSessions: body.totalSessions }),
      },
    })
    return updated
  })

  // Delete protocol
  app.delete('/api/protocols/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const protocol = await prisma.protocol.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!protocol) return reply.code(404).send({ error: 'Protocolo não encontrado.' })
    await prisma.protocol.delete({ where: { id } })
    return reply.code(204).send()
  })

  // Get sessions linked to a protocol
  app.get('/api/protocols/:id/sessions', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const protocol = await prisma.protocol.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!protocol) return reply.code(404).send({ error: 'Protocolo não encontrado.' })

    const sessions = await prisma.schedule.findMany({
      where: { clinicId: r.clinicId, protocolId: id },
      orderBy: { startTime: 'desc' },
      include: { client: { select: { id: true, name: true } } },
      take: 50,
    })
    return sessions
  })
}
