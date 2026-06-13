import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clinic
  const clinic = await prisma.clinic.upsert({
    where: { phone: '11999999999' },
    update: {},
    create: {
      name: 'Clínica Precya Demo',
      phone: '11999999999',
    },
  })

  console.log(`Clinic: ${clinic.name} (${clinic.id})`)

  // Owner user
  const passwordHash = await bcrypt.hash('precya123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@precya.app' },
    update: { passwordHash },
    create: {
      clinicId: clinic.id,
      email:    'admin@precya.app',
      name:     'Admin Precya',
      role:     'owner',
      passwordHash,
    },
  })

  console.log(`User: ${user.email} / precya123 (${user.role})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
