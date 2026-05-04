import { Hono } from 'hono'
import type { Context } from 'hono'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import {
  sendShowcaseFormNotification,
  sendEcommerceFormNotification,
  type ShowcaseFormScalars,
  type EcommerceFormScalars,
} from '../mailer.js'
import { isS3Configured, uploadObject } from '../storage.js'

const DATA_DIR = process.env.DATA_DIR ?? 'data'

const form = new Hono()

const generateSubmissionId = (): string => {
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  const rand = randomBytes(3).toString('hex')
  return `${ts}-${rand}`
}

type Asset = { name: string; buffer: Buffer; contentType?: string }

const fileToAsset = async (name: string, file: File): Promise<Asset> => ({
  name,
  buffer: Buffer.from(await file.arrayBuffer()),
  contentType: file.type || undefined,
})

const persistToDisk = async (dir: string, dataJson: string, assets: Asset[]): Promise<void> => {
  const photosDir = join(dir, 'photos')
  await mkdir(photosDir, { recursive: true })
  await writeFile(join(dir, 'data.json'), dataJson)
  await Promise.all(assets.map((a) => writeFile(join(dir, a.name), a.buffer)))
}

const uploadToS3 = async (
  prefix: string,
  id: string,
  dataJson: string,
  assets: Asset[],
): Promise<void> => {
  const fullPrefix = `${prefix}/${id}`
  await Promise.all([
    uploadObject(`${fullPrefix}/data.json`, Buffer.from(dataJson), 'application/json'),
    ...assets.map((a) => uploadObject(`${fullPrefix}/${a.name}`, a.buffer, a.contentType)),
  ])
}

const collectFiles = (value: unknown): File[] => {
  if (Array.isArray(value)) return value.filter((v): v is File => v instanceof File)
  if (value instanceof File) return [value]
  return []
}

type SubmissionConfig<T> = {
  subdir: string
  logTag: string
  notify: (id: string, data: T, folder: string) => Promise<void>
}

const handleSubmission = async <T>(c: Context, config: SubmissionConfig<T>) => {
  const body = await c.req.parseBody({ all: true })

  const dataField = body['data']
  if (typeof dataField !== 'string') {
    return c.json({ error: 'Missing or invalid "data" field' }, 400)
  }

  let data: T
  try {
    data = JSON.parse(dataField) as T
  } catch {
    return c.json({ error: 'Invalid JSON in "data" field' }, 400)
  }

  const logoCandidate = body['logo']
  const logo = logoCandidate instanceof File ? logoCandidate : null
  const photos = collectFiles(body['photos'])

  const id = generateSubmissionId()
  const dir = join(DATA_DIR, config.subdir, id)
  const dataJson = JSON.stringify(data, null, 2)

  const assets: Asset[] = []
  if (logo) {
    assets.push(await fileToAsset(`logo${extname(logo.name)}`, logo))
  }
  for (const [i, file] of photos.entries()) {
    assets.push(await fileToAsset(`photos/photo-${i}${extname(file.name)}`, file))
  }

  const s3Enabled = isS3Configured()
  const [persistResult, s3Result, emailResult] = await Promise.allSettled([
    persistToDisk(dir, dataJson, assets),
    s3Enabled ? uploadToS3(config.subdir, id, dataJson, assets) : Promise.resolve(),
    config.notify(id, data, dir),
  ])

  if (persistResult.status === 'rejected') {
    console.error(`${config.logTag} persist failed`, persistResult.reason)
    return c.json({ error: 'Failed to persist submission' }, 500)
  }
  if (s3Result.status === 'rejected') {
    console.error(`${config.logTag} s3 upload failed`, s3Result.reason)
  }
  if (emailResult.status === 'rejected') {
    console.error(`${config.logTag} email failed`, emailResult.reason)
  }
  if (!s3Enabled) {
    console.warn(`${config.logTag} S3 not configured, skipping object upload`)
  }

  return c.json({
    id,
    folder: dir,
    emailSent: emailResult.status === 'fulfilled',
    s3Uploaded: s3Result.status === 'fulfilled' && s3Enabled,
  })
}

form.post('/showcase-form', (c) =>
  handleSubmission<ShowcaseFormScalars>(c, {
    subdir: 'showcase-forms',
    logTag: '[showcase-form]',
    notify: sendShowcaseFormNotification,
  }),
)

form.post('/ecommerce-form', (c) =>
  handleSubmission<EcommerceFormScalars>(c, {
    subdir: 'ecommerce-forms',
    logTag: '[ecommerce-form]',
    notify: sendEcommerceFormNotification,
  }),
)

export default form
