import Fastify from 'fastify'
import cors from '@fastify/cors'
import healthRoute from './routes/health'
import authRoute from './routes/auth'
import apiRoute from './routes/api'
import clientsRoute from './routes/clients'
import schedulesRoute from './routes/schedules'
import dashboardRoute from './routes/dashboard'
import clinicRoute from './routes/clinic'
import anamnesisRoute from './routes/anamnesis'
import publicRoute from './routes/public'
import protocolsRoute from './routes/protocols'

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
  process.exit(1)
})

async function start() {
  const app = Fastify({ logger: true })

  try {
    app.register(cors, { origin: true })
    app.register(healthRoute)
    app.register(authRoute)
    app.register(apiRoute)
    app.register(clientsRoute)
    app.register(schedulesRoute)
    app.register(dashboardRoute)
    app.register(clinicRoute)
    app.register(anamnesisRoute)
    app.register(publicRoute)
    app.register(protocolsRoute)
  } catch (err) {
    console.error('ERROR REGISTERING ROUTES:', err)
    process.exit(1)
  }

  const port = parseInt(process.env.PORT || '5003', 10)

  try {
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Server running on port ${port}`)
  } catch (err) {
    app.log.error({ err }, 'ERROR STARTING SERVER')
    process.exit(1)
  }
}

start()
