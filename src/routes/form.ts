import { Hono } from 'hono'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { sendShowcaseFormNotification, type ShowcaseFormScalars } from '../mailer.js'

const DATA_DIR = process.env.DATA_DIR ?? 'data'

const form = new Hono()

const generateSubmissionId = (): string => {
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  const rand = randomBytes(3).toString('hex')
  return `${ts}-${rand}`
}

const writeUpload = async (dir: string, name: string, file: File): Promise<void> => {
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(join(dir, name), buf)
}

const persistSubmission = async (
  dir: string,
  data: ShowcaseFormScalars,
  logo: File | null,
  photos: File[],
): Promise<void> => {
  const photosDir = join(dir, 'photos')
  await mkdir(photosDir, { recursive: true })
  await writeFile(join(dir, 'data.json'), JSON.stringify(data, null, 2))

  const tasks: Promise<void>[] = []
  if (logo) {
    tasks.push(writeUpload(dir, `logo${extname(logo.name)}`, logo))
  }
  photos.forEach((file, i) => {
    tasks.push(writeUpload(photosDir, `photo-${i}${extname(file.name)}`, file))
  })
  await Promise.all(tasks)
}

const collectFiles = (value: unknown): File[] => {
  if (Array.isArray(value)) return value.filter((v): v is File => v instanceof File)
  if (value instanceof File) return [value]
  return []
}

form.post('/showcase-form', async (c) => {
  const body = await c.req.parseBody({ all: true })

  const dataField = body['data']
  if (typeof dataField !== 'string') {
    return c.json({ error: 'Missing or invalid "data" field' }, 400)
  }

  let data: ShowcaseFormScalars
  try {
    data = JSON.parse(dataField) as ShowcaseFormScalars
  } catch {
    return c.json({ error: 'Invalid JSON in "data" field' }, 400)
  }

  const logoCandidate = body['logo']
  const logo = logoCandidate instanceof File ? logoCandidate : null
  const photos = collectFiles(body['photos'])

  const id = generateSubmissionId()
  const dir = join(DATA_DIR, 'showcase-forms', id)

  const [persistResult, emailResult] = await Promise.allSettled([
    persistSubmission(dir, data, logo, photos),
    sendShowcaseFormNotification(id, data, dir),
  ])

  if (persistResult.status === 'rejected') {
    console.error('[showcase-form] persist failed', persistResult.reason)
    return c.json({ error: 'Failed to persist submission' }, 500)
  }
  if (emailResult.status === 'rejected') {
    console.error('[showcase-form] email failed', emailResult.reason)
  }

  return c.json({ id, folder: dir, emailSent: emailResult.status === 'fulfilled' })
})

export default form
