const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const clientsData = [
  { name: 'Ana Carolina Mendes', phone: '(11) 98765-0001', status: 'ativo' },
  { name: 'Beatriz Santos Lima', phone: '(11) 98765-0002', status: 'ativo' },
  { name: 'Carlos Eduardo Rocha', phone: '(11) 98765-0003', status: 'ativo' },
  { name: 'Daniela Ferreira Costa', phone: '(11) 98765-0004', status: 'ativo' },
  { name: 'Fernanda Oliveira Silva', phone: '(11) 98765-0005', status: 'risco' },
  { name: 'Gabriel Monteiro Dias', phone: '(11) 98765-0006', status: 'ativo' },
  { name: 'Helena Carvalho Nunes', phone: '(11) 98765-0007', status: 'ativo' },
  { name: 'Igor Nascimento Pinto', phone: '(11) 98765-0008', status: 'inativo' },
]

async function main() {
  // Find the clinic
  const clinic = await prisma.clinic.findFirst({ where: { phone: '11999999999' } })
  if (!clinic) { console.error('Clinic not found — run seed.js first'); process.exit(1) }
  console.log(`Seeding demo data for clinic: ${clinic.name}`)

  // Create clients
  const clients = []
  for (const c of clientsData) {
    const existing = await prisma.client.findFirst({ where: { clinicId: clinic.id, phone: c.phone } })
    if (existing) { clients.push(existing); continue }
    const client = await prisma.client.create({ data: { clinicId: clinic.id, ...c } })
    clients.push(client)
    console.log(`  Client: ${client.name}`)
  }

  // Create past completed schedules (last 3 months)
  const now = new Date()
  const sessions = []

  // Helper: random element
  const pick = arr => arr[Math.floor(Math.random() * arr.length)]
  const prices = [150, 170, 180, 200]

  for (let daysAgo = 1; daysAgo <= 75; daysAgo += pick([3, 4, 5, 6, 7])) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(pick([8, 9, 10, 14, 15, 16, 17]), 0, 0, 0)

    const client = pick(clients.slice(0, 6)) // active clients
    const endDate = new Date(date.getTime() + 60 * 60 * 1000)
    const price = pick(prices)

    sessions.push({ clinicId: clinic.id, clientId: client.id, startTime: date, endTime: endDate, price, status: 'completed' })
  }

  // Create upcoming schedules (next 2 weeks)
  for (let daysAhead = 1; daysAhead <= 14; daysAhead++) {
    if (Math.random() < 0.5) continue
    const date = new Date(now)
    date.setDate(date.getDate() + daysAhead)
    date.setHours(pick([9, 10, 14, 15, 16]), 0, 0, 0)

    const client = pick(clients.slice(0, 6))
    const endDate = new Date(date.getTime() + 60 * 60 * 1000)

    sessions.push({ clinicId: clinic.id, clientId: client.id, startTime: date, endTime: endDate, price: pick(prices), status: pick(['not_confirmed', 'confirmed']) })
  }

  // Insert schedules
  let created = 0
  for (const s of sessions) {
    try {
      await prisma.schedule.create({ data: s })
      created++
    } catch {}
  }
  console.log(`  Created ${created} schedules`)

  // Update client session counts
  for (const client of clients) {
    const completed = await prisma.schedule.findMany({ where: { clinicId: clinic.id, clientId: client.id, status: 'completed' } })
    const total = completed.reduce((sum, s) => sum + Number(s.price ?? 0), 0)
    const last = completed.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0]
    await prisma.client.update({
      where: { id: client.id },
      data: { sessionCount: completed.length, lifetimeValue: total, lastSessionDate: last?.startTime ?? null },
    })
  }
  console.log('  Updated client stats')
  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
