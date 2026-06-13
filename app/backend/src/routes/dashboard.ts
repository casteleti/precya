import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()

type AuthReq = FastifyRequest & { clinicId: string }

export default async function dashboardRoute(app: FastifyInstance) {
  app.get('/api/dashboard', { preHandler: verifyToken }, async (req) => {
    const r = req as AuthReq
    const clinicId = r.clinicId

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd   = new Date(todayStart.getTime() + 86400000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      todaySchedules,
      activeClients,
      monthRevenue,
      upcomingSchedules,
    ] = await Promise.all([
      prisma.schedule.count({
        where: { clinicId, startTime: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.client.count({ where: { clinicId, status: 'ativo' } }),
      prisma.schedule.aggregate({
        where: { clinicId, status: 'completed', startTime: { gte: monthStart } },
        _sum: { price: true },
      }),
      prisma.schedule.findMany({
        where: {
          clinicId,
          startTime: { gte: now },
          status: { in: ['not_confirmed', 'confirmed'] },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
        include: { client: { select: { id: true, name: true, phone: true } } },
      }),
    ])

    // Return rate: clients with > 1 session / total clients
    const totalClients = await prisma.client.count({ where: { clinicId } })
    const returningClients = await prisma.client.count({
      where: { clinicId, sessionCount: { gt: 1 } },
    })
    const returnRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0

    return {
      todaySchedules,
      activeClients,
      monthRevenue: Number(monthRevenue._sum.price ?? 0),
      returnRate,
      upcomingSchedules,
    }
  })
}
