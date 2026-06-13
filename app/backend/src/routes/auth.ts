import type { FastifyInstance } from 'fastify'

export default async function authRoute(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    reply.code(501).send({ error: 'not implemented' })
  })
}
