import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'precya-dev-secret'

interface TokenPayload {
  sub: string
  clinicId: string
  role: string
}

export async function verifyToken(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Token não fornecido.' })
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    ;(req as FastifyRequest & { clinicId: string; userId: string; role: string }).clinicId = payload.clinicId
    ;(req as FastifyRequest & { clinicId: string; userId: string; role: string }).userId  = payload.sub
    ;(req as FastifyRequest & { clinicId: string; userId: string; role: string }).role    = payload.role
  } catch {
    return reply.code(401).send({ error: 'Token inválido ou expirado.' })
  }
}
