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

    // Last 6 months revenue
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const completedLast6 = await prisma.schedule.findMany({
      where: { clinicId, status: 'completed', startTime: { gte: sixMonthsAgo } },
      select: { startTime: true, price: true },
    })
    const revenueByMonth: Record<string, number> = {}
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = 0
    }
    for (const s of completedLast6) {
      const d = new Date(s.startTime)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in revenueByMonth) revenueByMonth[key] += Number(s.price ?? 0)
    }
    const monthlyRevenue = Object.entries(revenueByMonth).map(([month, total]) => ({ month, total }))

    return {
      todaySchedules,
      activeClients,
      monthRevenue: Number(monthRevenue._sum.price ?? 0),
      returnRate,
      upcomingSchedules,
      monthlyRevenue,
    }
  })
}
