import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET ?? 'precya-dev-secret'
const JWT_EXPIRES = '7d'

export default async function authRoute(app: FastifyInstance) {
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
