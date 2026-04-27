import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const endpoint = process.env.S3_ENDPOINT?.trim() || undefined
const region = process.env.S3_REGION?.trim() || 'us-east-1'
const bucket = process.env.S3_BUCKET?.trim()
const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim()
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true'

let client: S3Client | null = null

const getClient = (): S3Client | null => {
  if (!bucket || !accessKeyId || !secretAccessKey) return null
  if (!client) {
    client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return client
}

export const isS3Configured = (): boolean => getClient() !== null

export const uploadObject = async (
  key: string,
  body: Buffer,
  contentType?: string,
): Promise<void> => {
  const c = getClient()
  if (!c || !bucket) {
    throw new Error('S3 is not configured')
  }
  await c.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}
