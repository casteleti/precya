import type { FastifyInstance } from 'fastify'

export default async function apiRoute(app: FastifyInstance) {
  app.get('/api', async () => ({ message: 'Precya API' }))
}
