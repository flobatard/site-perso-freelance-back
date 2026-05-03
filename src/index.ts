import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import form from './routes/form.js'
import { startCleanupScheduler } from './cleanup.js'

const app = new Hono()

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:8081,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/form', form)

startCleanupScheduler()

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
