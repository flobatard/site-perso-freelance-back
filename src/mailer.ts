import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export type ShowcaseFormScalars = {
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

let cachedTransporter: Transporter | null = null

const buildTransporter = (): Transporter =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

const getTransporter = (): Transporter => {
  if (!cachedTransporter) cachedTransporter = buildTransporter()
  return cachedTransporter
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderShowcaseEmail = (
  id: string,
  data: ShowcaseFormScalars,
  folderPath: string,
): string => {
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

export const sendShowcaseFormNotification = async (
  id: string,
  data: ShowcaseFormScalars,
  folderPath: string,
): Promise<void> => {
  const to = process.env.NOTIFY_TO
  const from = process.env.SMTP_FROM
  if (!to || !from || !process.env.SMTP_HOST) {
    console.warn('[mailer] SMTP not configured, skipping notification email')
    return
  }
  await getTransporter().sendMail({
    from,
    to,
    subject: `Nouveau formulaire vitrine${data.activity ? ` — ${data.activity}` : ''} (${id})`,
    html: renderShowcaseEmail(id, data, folderPath),
  })
}
