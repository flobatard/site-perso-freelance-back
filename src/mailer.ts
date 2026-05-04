import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export type ShowcaseFormScalars = {
  activity: string
  audience: string
  goal: string
  inspirations: string
  adjectives: string[]
  brandAssets: 'yes' | 'no' | ''
  colors: string[]
  photos: 'yes' | 'no' | ''
  sections: string[]
  customSections: string[]
  deadline: string
  hasDomain: 'yes' | 'no' | ''
  domainName: string
  notes: string
  firstName: string
  lastName: string
  email: string
  phone: string
  projectName: string
  consent: boolean
}

export type EcommerceFormScalars = {
  projectName: string
  pitch: string
  productTypes: string[]
  businessModel: string
  currentSales: string
  currentPlatform: string
  audience: string
  targetPlatform: string
  launchVolume: string
  yearVolume: string
  variants: string
  stockManagement: string
  productSheetsReady: string
  paymentMethods: string[]
  transactionType: string
  currencies: string
  shippingZones: string[]
  shippingMethods: string[]
  freeShipping: string
  vat: string
  guestCheckout: string
  features: string[]
  seoStrategy: string
  accounting: string
  accountingOther: string
  erpCrm: string
  shippingTool: string
  shippingToolOther: string
  marketplaceSync: string[]
  migration: string
  adminCount: string
  adminRoles: string
  hasLogo: string
  hasColors: string
  colors: string[]
  productPhotos: string
  inspirations: string
  adjectives: string[]
  deadline: string
  hasDomain: string
  domainName: string
  budget: string
  notes: string
  firstName: string
  lastName: string
  email: string
  phone: string
  consent: boolean
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

const yesNo = (value: 'yes' | 'no' | ''): string =>
  value === 'yes' ? 'oui' : value === 'no' ? 'non' : ''

const renderShowcaseEmail = (
  id: string,
  data: ShowcaseFormScalars,
  folderPath: string,
): string => {
  const contactName = [data.firstName, data.lastName].filter(Boolean).join(' ')
  const rows: [string, string][] = [
    ['Projet', data.projectName],
    ['Contact', contactName],
    ['Email', data.email],
    ['Téléphone', data.phone],
    ['Activité', data.activity],
    ['Cible', data.audience],
    ['Objectif', data.goal],
    ['Échéance', data.deadline],
    ['Inspirations', data.inspirations],
    ['Adjectifs', data.adjectives.join(', ')],
    ['Assets de marque', yesNo(data.brandAssets)],
    ['Couleurs', data.colors.join(', ')],
    ['Photos disponibles', yesNo(data.photos)],
    ['Sections', data.sections.join(', ')],
    ['Sections personnalisées', data.customSections.join(', ')],
    ['Domaine ?', yesNo(data.hasDomain)],
    ['Nom de domaine', data.domainName],
    ['Notes', data.notes],
    ['Consentement', data.consent ? 'oui' : 'non'],
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

const renderRows = (rows: [string, string][]): string =>
  rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(value || '—')}</td></tr>`,
    )
    .join('')

const renderSection = (title: string, rows: [string, string][]): string =>
  `<h3 style="margin:16px 0 4px;font-family:sans-serif">${escapeHtml(title)}</h3><table style="border-collapse:collapse;font-family:sans-serif">${renderRows(rows)}</table>`

const renderEcommerceEmail = (
  id: string,
  data: EcommerceFormScalars,
  folderPath: string,
): string => {
  const contactName = [data.firstName, data.lastName].filter(Boolean).join(' ')

  const integrationRows: [string, string][] = [
    ['Comptabilité', data.accounting],
    ...(data.accountingOther
      ? [['Comptabilité (autre)', data.accountingOther] as [string, string]]
      : []),
    ['ERP / CRM', data.erpCrm],
    ["Outil d'expédition", data.shippingTool],
    ...(data.shippingToolOther
      ? [["Outil d'expédition (autre)", data.shippingToolOther] as [string, string]]
      : []),
    ['Sync marketplaces', data.marketplaceSync.join(', ')],
    ['Migration', data.migration],
    ['Nb administrateurs', data.adminCount],
    ['Rôles admin', data.adminRoles],
  ]

  return `
    <h2>Nouveau formulaire e-commerce — ${escapeHtml(id)}</h2>
    <p>Dossier local : <code>${escapeHtml(folderPath)}</code></p>
    ${renderSection('Contact', [
      ['Projet', data.projectName],
      ['Contact', contactName],
      ['Email', data.email],
      ['Téléphone', data.phone],
      ['Consentement', data.consent ? 'oui' : 'non'],
    ])}
    ${renderSection('Activité', [
      ['Pitch', data.pitch],
      ['Types de produits', data.productTypes.join(', ')],
      ['Modèle business', data.businessModel],
      ['Ventes actuelles', data.currentSales],
      ['Plateforme actuelle', data.currentPlatform],
      ['Cible', data.audience],
      ['Plateforme cible', data.targetPlatform],
    ])}
    ${renderSection('Catalogue', [
      ['Volume au lancement', data.launchVolume],
      ['Volume annuel', data.yearVolume],
      ['Variantes', data.variants],
      ['Gestion stock', data.stockManagement],
      ['Fiches produits prêtes', data.productSheetsReady],
    ])}
    ${renderSection('Paiement / Livraison / TVA', [
      ['Moyens de paiement', data.paymentMethods.join(', ')],
      ['Type de transactions', data.transactionType],
      ['Devises', data.currencies],
      ['Zones de livraison', data.shippingZones.join(', ')],
      ['Méthodes de livraison', data.shippingMethods.join(', ')],
      ['Livraison gratuite', data.freeShipping],
      ['TVA', data.vat],
    ])}
    ${renderSection('UX & Marketing', [
      ['Checkout invité', data.guestCheckout],
      ['Fonctionnalités', data.features.join(', ')],
      ['Stratégie SEO', data.seoStrategy],
    ])}
    ${renderSection('Intégrations & migration', integrationRows)}
    ${renderSection('Identité & pratique', [
      ['Logo ?', data.hasLogo],
      ['Couleurs ?', data.hasColors],
      ['Couleurs', data.colors.join(', ')],
      ['Photos produits', data.productPhotos],
      ['Inspirations', data.inspirations],
      ['Adjectifs', data.adjectives.join(', ')],
      ['Échéance', data.deadline],
      ['Domaine ?', data.hasDomain],
      ['Nom de domaine', data.domainName],
      ['Budget', data.budget],
      ['Notes', data.notes],
    ])}
  `
}

export const sendEcommerceFormNotification = async (
  id: string,
  data: EcommerceFormScalars,
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
    subject: `Nouveau formulaire e-commerce${data.projectName ? ` — ${data.projectName}` : ''} (${id})`,
    html: renderEcommerceEmail(id, data, folderPath),
  })
}
