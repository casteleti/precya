import type { FastifyInstance, FastifyRequest } from 'fastify'
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../middleware/auth'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET ?? 'precya-dev-secret'
const JWT_EXPIRES = '7d'

type AuthReq = FastifyRequest & { clinicId: string; userId: string }

export default async function authRoute(app: FastifyInstance) {
  // ── Register (new clinic + owner) ─────────────────────────────────────────
  app.post<{ Body: { clinicName: string; clinicPhone: string; name: string; email: string; password: string } }>(
    '/auth/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['clinicName', 'clinicPhone', 'name', 'email', 'password'],
          properties: {
            clinicName:  { type: 'string', minLength: 2 },
            clinicPhone: { type: 'string', minLength: 8 },
            name:        { type: 'string', minLength: 2 },
            email:       { type: 'string', format: 'email' },
            password:    { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      const { clinicName, clinicPhone, name, email, password } = req.body

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.code(409).send({ error: 'Este e-mail já está cadastrado.' })
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const clinic = await tx.clinic.create({
          data: { name: clinicName, phone: clinicPhone },
        })
        return tx.user.create({
          data: { clinicId: clinic.id, email, name, passwordHash, role: 'owner' },
        })
      })

      const token = jwt.sign(
        { sub: user.id, clinicId: user.clinicId, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES },
      )

      return reply.code(201).send({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, clinicId: user.clinicId },
      })
    },
  )

  // ── Update profile ─────────────────────────────────────────────────────────
  app.patch<{ Body: { name?: string; email?: string } }>(
    '/auth/me',
    { preHandler: verifyToken },
    async (req, reply) => {
      const r = req as AuthReq
      const { name, email } = req.body as { name?: string; email?: string }

      if (email) {
        const conflict = await prisma.user.findFirst({
          where: { email, id: { not: r.userId } },
        })
        if (conflict) return reply.code(409).send({ error: 'Este e-mail já está em uso.' })
      }

      const user = await prisma.user.update({
        where: { id: r.userId },
        data: { ...(name ? { name } : {}), ...(email ? { email } : {}) },
      })

      return reply.send({ id: user.id, name: user.name, email: user.email, role: user.role, clinicId: user.clinicId })
    },
  )

  // ── Change password ────────────────────────────────────────────────────────
  app.post<{ Body: { currentPassword: string; newPassword: string } }>(
    '/auth/change-password',
    { preHandler: verifyToken },
    async (req, reply) => {
      const r = req as AuthReq
      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string }

      if (!currentPassword || !newPassword || newPassword.length < 6) {
        return reply.code(400).send({ error: 'Senha inválida. Mínimo 6 caracteres.' })
      }

      const user = await prisma.user.findUnique({ where: { id: r.userId } })
      if (!user) return reply.code(404).send({ error: 'Usuário não encontrado.' })

      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) return reply.code(401).send({ error: 'Senha atual incorreta.' })

      const passwordHash = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({ where: { id: r.userId }, data: { passwordHash } })

      return reply.send({ ok: true })
    },
  )

  // ── Login ──────────────────────────────────────────────────────────────────
  app.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (req, reply) => {
      const { email, password } = req.body

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return reply.code(401).send({ error: 'Credenciais inválidas.' })
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return reply.code(401).send({ error: 'Credenciais inválidas.' })
      }

      const token = jwt.sign(
        { sub: user.id, clinicId: user.clinicId, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES },
      )

      return reply.send({
        token,
        user: {
          id:       user.id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          clinicId: user.clinicId,
        },
      })
    },
  )
}
