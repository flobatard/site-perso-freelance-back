import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import * as L from './labels.js'
import { label, labelList } from './labels.js'

export type ShowcaseFormScalars = {
  activity: string
  audience: string
  goal: string
  inspirations: string
  adjectives: string[]
  hasLogo: 'yes' | 'no' | ''
  hasColors: 'yes' | 'no' | ''
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
    ['Objectif', label(L.SHOWCASE_GOAL, data.goal)],
    ['Échéance', label(L.DEADLINE, data.deadline)],
    ['Inspirations', data.inspirations],
    ['Adjectifs', labelList(L.ADJECTIVES, data.adjectives)],
    ['Logo ?', label(L.HAS_LOGO, data.hasLogo)],
    ['Couleurs de marque ?', label(L.HAS_COLORS, data.hasColors)],
    ['Couleurs', data.colors.join(', ')],
    ['Photos disponibles', label(L.SHOWCASE_PHOTOS, data.photos)],
    ['Sections', labelList(L.SHOWCASE_SECTIONS, data.sections)],
    ['Sections personnalisées', data.customSections.join(', ')],
    ['Domaine ?', label(L.YES_NO, data.hasDomain)],
    ['Nom de domaine', data.domainName],
    ['Notes', data.notes],
    ['Consentement', data.consent ? 'Oui' : 'Non'],
  ]
  const body = rows
    .map(
      ([name, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>${escapeHtml(name)}</strong></td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(value || '—')}</td></tr>`,
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
      ([name, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>${escapeHtml(name)}</strong></td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(value || '—')}</td></tr>`,
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

  // "Autre" + précision saisie → "Autre : <précision>" sur une seule ligne.
  const withOther = (map: L.Labels, value: string, other: string): string =>
    value === 'other' && other.trim() ? `Autre : ${other.trim()}` : label(map, value)

  return `
    <h2>Nouveau formulaire e-commerce — ${escapeHtml(id)}</h2>
    <p>Dossier local : <code>${escapeHtml(folderPath)}</code></p>
    ${renderSection('Contact', [
      ['Projet', data.projectName],
      ['Contact', contactName],
      ['Email', data.email],
      ['Téléphone', data.phone],
      ['Consentement', data.consent ? 'Oui' : 'Non'],
    ])}
    ${renderSection('Activité', [
      ['Pitch', data.pitch],
      ['Types de produits', labelList(L.PRODUCT_TYPES, data.productTypes)],
      ['Clientèle', label(L.BUSINESS_MODEL, data.businessModel)],
      ['Ventes actuelles', label(L.CURRENT_SALES, data.currentSales)],
      ['Plateforme actuelle', label(L.CURRENT_PLATFORM, data.currentPlatform)],
      ['Cible', data.audience],
      ['Plateforme cible', label(L.TARGET_PLATFORM, data.targetPlatform)],
    ])}
    ${renderSection('Catalogue', [
      ['Produits au lancement', label(L.VOLUME, data.launchVolume)],
      ['Produits dans 1 an', label(L.VOLUME, data.yearVolume)],
      ['Variantes', label(L.VARIANTS, data.variants)],
      ['Gestion des stocks', label(L.STOCK_MANAGEMENT, data.stockManagement)],
      ['Fiches produits', label(L.PRODUCT_SHEETS, data.productSheetsReady)],
    ])}
    ${renderSection('Paiement / Livraison / TVA', [
      ['Moyens de paiement', labelList(L.PAYMENT_METHODS, data.paymentMethods)],
      ['Type de transaction', label(L.TRANSACTION_TYPE, data.transactionType)],
      ['Devises', label(L.CURRENCIES, data.currencies)],
      ['Zones de livraison', labelList(L.SHIPPING_ZONES, data.shippingZones)],
      ['Modes de livraison', labelList(L.SHIPPING_METHODS, data.shippingMethods)],
      ['Livraison gratuite', label(L.FREE_SHIPPING, data.freeShipping)],
      ['TVA', label(L.VAT, data.vat)],
    ])}
    ${renderSection('UX & Marketing', [
      ['Achat invité', label(L.GUEST_CHECKOUT, data.guestCheckout)],
      ['Fonctionnalités', labelList(L.FEATURES, data.features)],
      ['Stratégie SEO / SEA', label(L.SEO_STRATEGY, data.seoStrategy)],
    ])}
    ${renderSection('Intégrations & migration', [
      ['Comptabilité', withOther(L.ACCOUNTING, data.accounting, data.accountingOther)],
      ['ERP / CRM', data.erpCrm],
      ["Outil d'expédition", withOther(L.SHIPPING_TOOL, data.shippingTool, data.shippingToolOther)],
      ['Sync marketplaces', labelList(L.MARKETPLACES, data.marketplaceSync)],
      ['Migration', label(L.MIGRATION, data.migration)],
      ['Nb administrateurs', label(L.ADMIN_COUNT, data.adminCount)],
      ['Rôles admin différents', label(L.YES_NO, data.adminRoles)],
    ])}
    ${renderSection('Identité & pratique', [
      ['Logo ?', label(L.HAS_LOGO, data.hasLogo)],
      ['Couleurs de marque ?', label(L.HAS_COLORS, data.hasColors)],
      ['Couleurs', data.colors.join(', ')],
      ['Photos produits', label(L.PRODUCT_PHOTOS, data.productPhotos)],
      ['Inspirations', data.inspirations],
      ['Adjectifs', labelList(L.ADJECTIVES, data.adjectives)],
      ['Échéance', label(L.DEADLINE, data.deadline)],
      ['Domaine ?', label(L.YES_NO, data.hasDomain)],
      ['Nom de domaine', data.domainName],
      ['Budget', label(L.BUDGET, data.budget)],
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
