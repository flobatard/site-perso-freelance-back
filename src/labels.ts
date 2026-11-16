// Libellés français des valeurs envoyées par les formulaires du front
// (site-perso-freelance, src/locales/fr.json → offering.offerings.<id>.form).
// Toute nouvelle option côté front doit être ajoutée ici ; à défaut, le mail
// affiche la valeur technique brute.

export type Labels = Readonly<Record<string, string>>

export const label = (map: Labels, value: string | undefined): string =>
  value ? (map[value] ?? value) : ''

export const labelList = (map: Labels, values: string[] | undefined): string =>
  (values ?? []).map((v) => label(map, v)).join(', ')

// --- Communs ---

export const YES_NO: Labels = { yes: 'Oui', no: 'Non' }

export const HAS_LOGO: Labels = { yes: 'Oui', no: 'Non, je vous laisse proposer' }

export const HAS_COLORS: Labels = { yes: 'Oui', no: 'Non, je vous laisse proposer' }

export const ADJECTIVES: Labels = {
  modern: 'Moderne & épuré',
  warm: 'Chaleureux & accessible',
  premium: 'Premium & élégant',
  bold: 'Audacieux & créatif',
  serious: 'Sérieux & rassurant',
}

export const DEADLINE: Labels = {
  lt_2_weeks: 'Moins de 2 semaines',
  '1_month': '1 mois',
  '1_to_3_months': '1 à 3 mois',
  '3_to_6_months': '3 à 6 mois',
  gt_6_months: '6 mois et plus',
}

// --- Formulaire vitrine ---

export const SHOWCASE_GOAL: Labels = {
  seo: 'Être trouvé sur Google',
  trust: 'Rassurer avant un premier contact',
  offers: 'Présenter mes offres clairement',
  link: 'Avoir un lien pro à partager',
}

export const SHOWCASE_PHOTOS: Labels = {
  yes: 'Oui',
  no: 'Non, il faudra des photos libres de droit',
}

export const SHOWCASE_SECTIONS: Labels = {
  about: 'À propos',
  services: 'Services / Offres',
  testimonials: 'Témoignages',
  contact: 'Contact',
  faq: 'FAQ',
  gallery: 'Galerie / Portfolio',
  pricing: 'Tarifs',
  blog: 'Blog',
}

// --- Formulaire e-commerce ---

export const PRODUCT_TYPES: Labels = {
  physical: 'Produits physiques',
  digital: 'Produits digitaux (ebooks, fichiers, formations)',
  services: 'Services',
  subscriptions: 'Abonnements',
  mix: 'Mix de plusieurs',
}

export const BUSINESS_MODEL: Labels = {
  b2c: 'Particuliers (B2C)',
  b2b: 'Professionnels (B2B)',
  both: 'Les deux (B2C et B2B)',
}

export const CURRENT_SALES: Labels = {
  not_yet: 'Pas encore',
  physical_store: 'En boutique physique',
  other_site: 'Sur un autre site',
  marketplace: 'Sur une marketplace (Amazon, Etsy…)',
}

export const CURRENT_PLATFORM: Labels = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  prestashop: 'Prestashop',
  wix: 'Wix',
  other: 'Autre',
}

export const TARGET_PLATFORM: Labels = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  prestashop: 'Prestashop',
  custom: 'Sur-mesure (développement custom)',
  advice: 'Je veux un conseil',
}

export const VOLUME: Labels = {
  lt_10: 'Moins de 10',
  '10_50': '10 à 50',
  '50_200': '50 à 200',
  '200_1000': '200 à 1000',
  gt_1000: 'Plus de 1000',
}

export const VARIANTS: Labels = {
  no: 'Non',
  simple: 'Oui, simples (taille, couleur)',
  complex: 'Oui, complexes (personnalisation, configuration)',
}

export const STOCK_MANAGEMENT: Labels = {
  none: 'Pas de stocks (services / digital)',
  simple: 'Stocks simples',
  realtime: 'Temps réel',
  multi_warehouse: 'Multi-entrepôts',
}

export const PRODUCT_SHEETS: Labels = {
  ready: 'Oui, textes et photos prêts',
  text_only: 'Textes seulement',
  nothing: 'Rien encore',
  import: "À reprendre d'un autre site",
}

export const PAYMENT_METHODS: Labels = {
  card: 'Carte bancaire',
  apple_google_pay: 'Apple Pay / Google Pay',
  paypal: 'PayPal',
  bank_transfer: 'Virement bancaire',
  sepa: 'Prélèvement SEPA',
  installments: 'Paiement en plusieurs fois (Alma, Klarna)',
}

export const TRANSACTION_TYPE: Labels = {
  one_time: 'Paiement unique',
  subscription: 'Abonnement récurrent',
  both: 'Les deux (paiement unique et abonnement)',
}

export const CURRENCIES: Labels = {
  eur_only: 'EUR uniquement',
  multi: 'Multi-devises',
}

export const SHIPPING_ZONES: Labels = {
  metro_fr: 'France métropolitaine',
  dom_tom: 'DOM-TOM',
  eu: 'Union européenne',
  world: 'Monde entier',
}

export const SHIPPING_METHODS: Labels = {
  colissimo: 'Colissimo',
  mondial_relay: 'Mondial Relay (points relais)',
  chronopost: 'Chronopost',
  custom_carrier: 'Transporteur custom',
  click_collect: 'Click & collect',
  store_pickup: 'Retrait en boutique',
  digital_delivery: 'Livraison numérique (digital)',
}

export const FREE_SHIPPING: Labels = {
  never: 'Jamais',
  above_threshold: "Au-dessus d'un seuil de panier",
  always: 'Toujours',
}

export const VAT: Labels = {
  standard_fr: 'TVA standard France',
  multi_rates: 'Multi-taux (5,5 % / 10 % / 20 %)',
  intra_eu: 'Vente intracommunautaire',
  outside_eu: 'Vente hors UE',
  unknown: 'Je ne sais pas',
}

export const GUEST_CHECKOUT: Labels = {
  guest_allowed: 'Achat invité accepté',
  account_required: 'Compte obligatoire',
}

export const FEATURES: Labels = {
  wishlist: 'Liste de souhaits',
  loyalty: 'Programme de fidélité / points',
  promo_codes: 'Codes promo et réductions',
  reviews: 'Avis clients',
  recommendations: 'Recommandations / produits associés',
  newsletter: 'Inscription newsletter',
  abandoned_cart: 'Relance panier abandonné',
  blog: 'Blog / contenu éditorial',
  chat: 'Chat / support en ligne',
}

export const SEO_STRATEGY: Labels = {
  self_managed: 'Oui, je gère',
  needs_advice: "J'aimerais des conseils",
  not_yet: 'Pas encore réfléchi',
}

export const ACCOUNTING: Labels = {
  pennylane: 'Pennylane',
  sage: 'Sage',
  quickbooks: 'Quickbooks',
  none: 'Aucun',
  other: 'Autre',
}

export const SHIPPING_TOOL: Labels = {
  sendcloud: 'Sendcloud',
  boxtal: 'Boxtal',
  none: 'Aucun',
  other: 'Autre',
}

export const MARKETPLACES: Labels = {
  amazon: 'Amazon',
  etsy: 'Etsy',
  cdiscount: 'Cdiscount',
  none: 'Aucune',
}

export const MIGRATION: Labels = {
  no: 'Non',
  products_only: 'Oui, produits seulement',
  products_customers: 'Oui, produits + clients',
  full: 'Oui, produits + clients + commandes',
}

export const ADMIN_COUNT: Labels = {
  '1': '1 seul',
  '2_3': '2 à 3',
  '4_plus': '4 ou plus',
}

export const PRODUCT_PHOTOS: Labels = {
  pro: 'Oui, photos pro prêtes',
  to_retouch: 'Oui, mais à retoucher',
  to_shoot: 'Non, à shooter',
  supplier_dynamic: 'Non, photos fournisseurs (à intégrer dynamiquement)',
}

export const BUDGET: Labels = {
  lt_10k: 'Moins de 10 000 €',
  '10_30k': '10 000 à 30 000 €',
  '30_60k': '30 000 à 60 000 €',
  '60_100k': '60 000 à 100 000 €',
  gt_100k: 'Plus de 100 000 €',
  unknown: 'Je ne sais pas, à discuter',
}
