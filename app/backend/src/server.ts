import Fastify from 'fastify'
import healthRoute from './routes/health'
import authRoute from './routes/auth'
import apiRoute from './routes/api'

const app = Fastify({ logger: true })

app.register(healthRoute)
app.register(authRoute)
app.register(apiRoute)

const port = parseInt(process.env.PORT || '5003', 10)
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
