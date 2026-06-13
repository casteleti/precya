import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()

type AuthReq = FastifyRequest & { clinicId: string; userId: string }

export default async function clientsRoute(app: FastifyInstance) {
  // List clients
  app.get('/api/clients', { preHandler: verifyToken }, async (req) => {
    const r = req as AuthReq
    const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: Record<string, unknown> = { clinicId: r.clinicId }
    if (status) where.status = status
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true, name: true, phone: true, status: true,
          birthDate: true, lastSessionDate: true, sessionCount: true,
          lifetimeValue: true, createdAt: true,
        },
      }),
      prisma.client.count({ where }),
    ])

    return { clients, total, page: parseInt(page), limit: parseInt(limit) }
  })

  // Get single client
  app.get('/api/clients/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const client = await prisma.client.findFirst({
      where: { id, clinicId: r.clinicId },
      include: {
        schedules: {
          orderBy: { startTime: 'desc' },
          take: 10,
          select: { id: true, startTime: true, endTime: true, status: true, price: true, notes: true },
        },
      },
    })
    if (!client) return reply.code(404).send({ error: 'Cliente não encontrado.' })
    return client
  })

  // Create client
  app.post('/api/clients', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const body = req.body as {
      name: string; phone: string; birthDate?: string; status?: string
    }
    const existing = await prisma.client.findUnique({
      where: { clinicId_phone: { clinicId: r.clinicId, phone: body.phone } },
    })
    if (existing) return reply.code(409).send({ error: 'Já existe um cliente com este telefone.' })

    const client = await prisma.client.create({
      data: {
        clinicId: r.clinicId,
        name: body.name,
        phone: body.phone,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        status: body.status ?? 'ativo',
      },
    })
    return reply.code(201).send(client)
  })

  // Update client
  app.put('/api/clients/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const body = req.body as { name?: string; phone?: string; birthDate?: string; status?: string }

    const client = await prisma.client.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!client) return reply.code(404).send({ error: 'Cliente não encontrado.' })

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone && { phone: body.phone }),
        ...(body.status && { status: body.status }),
        ...(body.birthDate !== undefined && {
          birthDate: body.birthDate ? new Date(body.birthDate) : null,
        }),
      },
    })
    return updated
  })

  // Delete client
  app.delete('/api/clients/:id', { preHandler: verifyToken }, async (req, reply) => {
    const r = req as AuthReq
    const { id } = req.params as { id: string }
    const client = await prisma.client.findFirst({ where: { id, clinicId: r.clinicId } })
    if (!client) return reply.code(404).send({ error: 'Cliente não encontrado.' })
    await prisma.client.delete({ where: { id } })
    return reply.code(204).send()
  })
}
