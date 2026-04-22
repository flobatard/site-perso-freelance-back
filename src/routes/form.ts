import { Hono } from 'hono'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'

type ShowcaseFormScalars = {
  activity: string
  audience: string
  goal: string
  inspirations: string
  adjectives: string[]
  brandAssets: string
  colors: string[]
  photos: string
  sections: string[]
  hasDomain: 'yes' | 'no' | ''
  domainName: string
  notes: string
  firstName: string
  lastName: string
  email: string
  phone: string
  projectName: string
}

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

const buildTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderEmail = (id: string, data: ShowcaseFormScalars, folderPath: string): string => {
  const rows: [string, string][] = [
    ['Activité', data.activity],
    ['Cible', data.audience],
    ['Objectif', data.goal],
    ['Inspirations', data.inspirations],
    ['Adjectifs', data.adjectives.join(', ')],
    ['Assets de marque', data.brandAssets],
    ['Couleurs', data.colors.join(', ')],
    ['Photos (description)', data.photos],
    ['Sections', data.sections.join(', ')],
    ['Domaine ?', data.hasDomain],
    ['Nom de domaine', data.domainName],
    ['Notes', data.notes],
  ]
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(value || '—')}</td></tr>`,
    )
    .join('')
  return `
    <h2>Nouveau formulaire vitrine — ${escapeHtml(id)}</h2>
    <p>Dossier local : <code>${escapeHtml(folderPath)}</code></p>
    <table style="border-collapse:collapse;font-family:sans-serif">${body}</table>
  `
}

const sendNotification = async (
  id: string,
  data: ShowcaseFormScalars,
  folderPath: string,
): Promise<void> => {
  const to = process.env.NOTIFY_TO
  const from = process.env.SMTP_FROM
  if (!to || !from || !process.env.SMTP_HOST) {
    console.warn('[showcase-form] SMTP not configured, skipping notification email')
    return
  }
  const transporter = buildTransporter()
  await transporter.sendMail({
    from,
    to,
    subject: `Nouveau formulaire vitrine${data.activity ? ` — ${data.activity}` : ''} (${id})`,
    html: renderEmail(id, data, folderPath),
  })
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
    sendNotification(id, data, dir),
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
