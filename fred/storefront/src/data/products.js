// AutoEffortless product catalogue — locked 2026-08-26, audience categories 2026-08-27
// Source of truth for the storefront. Prices in ZAR (per month unless noted).
// categories: 'personal' | 'business' | 'students' — an app can be in several.

export const PACKAGES = [
  {
    id: 'business-suite',
    name: 'Business Suite',
    icon: 'briefcase',
    emoji: '💼',
    price: 999,
    period: 'per month',
    tagline: 'All 15 apps for your business.',
    apps: 'All 15 apps',
    allApps: true,
    features: [
      'Every app in the store',
      '7-day free trial included',
      'Priority support',
      'Early access to new apps',
      'Cross-app data sync',
      'Cancel anytime'
    ],
    highlight: true
  },
  {
    id: 'personal-package',
    name: 'Personal Package',
    icon: 'user',
    emoji: '🙋',
    price: 299,
    period: 'per month',
    tagline: 'Life admin, side hustle and content — sorted.',
    apps: '6 apps',
    appIds: ['docchat', 'content-studio', 'website-builder', 'form-builder', 'invoice-app', 'booking-calendar'],
    features: [
      'DocChat, Content Studio, Website Builder',
      'Form Builder, Invoice & Quote, Booking',
      '7-day free trial included',
      'Email support',
      'Cancel anytime'
    ]
  },
  {
    id: 'university-package',
    name: 'University Package',
    icon: 'rocket',
    emoji: '🎓',
    price: 149,
    period: 'per month',
    tagline: 'Study smarter and build your portfolio.',
    apps: '4 apps',
    appIds: ['docchat', 'content-studio', 'website-builder', 'form-builder'],
    features: [
      'DocChat, Content Studio',
      'Website Builder, Form Builder',
      '7-day free trial included',
      'Student-friendly price',
      'Cancel anytime'
    ]
  }
]

// One-time "single use" price per app (no subscription — pay once, try it properly)
export const SINGLE_USE_PRICES = {
  docchat: 'R99',
  'contract-generator': 'R49',
  'content-studio': 'R99',
  'website-builder': 'R149',
  'form-builder': 'R79',
  'invoice-app': 'R99',
  'simple-crm': 'R99',
  'stock-inventory': 'R79',
  'small-team-hr': 'R79',
  'booking-calendar': 'R79',
  'school-admin': 'R149',
  'church-manager': 'R149',
  'property-manager': 'R149',
  'salon-booking': 'R99',
  'sports-club-manager': 'R79'
}

export const getPackage = (id) => PACKAGES.find((p) => p.id === id)

export const CATEGORIES = [
  {
    id: 'personal',
    name: 'For Personal Use',
    icon: 'user',
    emoji: '🙋',
    blurb: 'Run your own life smoother — documents, content, bookings, side income and more.'
  },
  {
    id: 'business',
    name: 'For Business',
    icon: 'briefcase',
    emoji: '💼',
    blurb: 'Get paid faster, keep customers, stock, staff and bookings under control.'
  },
  {
    id: 'students',
    name: 'For Students',
    icon: 'rocket',
    emoji: '🎓',
    blurb: 'High school & university — study smarter, build your portfolio, manage projects.'
  }
]

export const TIERS = [
  { id: 'ai', name: 'Tier 1 — AI Tools', blurb: 'Let AI do the heavy lifting.' },
  { id: 'business', name: 'Tier 2 — Business Apps', blurb: 'Run the day-to-day.' },
  { id: 'vertical', name: 'Tier 3 — Vertical Apps', blurb: 'Purpose-built for specific industries.' }
]

export const PRODUCTS = [
  // ── Tier 1: AI ─────────────────────────────────────────────
  {
    id: 'docchat',
    slug: 'docchat',
    name: 'DocChat',
    tier: 'ai',
    price: 'R99–R199/mo',
    icon: 'message',
    emoji: '📄',
    tagline: 'Chat with your documents — answers in seconds.',
    description:
      'Upload your documents (contracts, policies, manuals, study notes) and ask questions in plain language. DocChat reads your documents and answers instantly — no more hunting through files.',
    features: [
      'Upload PDFs, Word, Excel, text files',
      'Ask questions in plain language',
      'Answers with source references',
      'Per-team knowledge library',
      'Works on phone and desktop'
    ],
    ai: true,
    categories: ['personal', 'business', 'students']
  },
  {
    id: 'contract-generator',
    slug: 'contract-generator',
    name: 'Contract & Quote Generator',
    tier: 'ai',
    price: 'R99/mo',
    icon: 'file-text',
    emoji: '📝',
    tagline: 'Professional quotes and contracts in minutes.',
    description:
      'Answer a few questions and get a professional, legally-minded quote or contract draft. Built for SA small business — plain language, editable, exportable to PDF.',
    features: [
      'Quote and contract templates',
      'South African business wording',
      'Editable before sending',
      'PDF export',
      'Client approval tracking'
    ],
    ai: true,
    categories: ['business']
  },
  {
    id: 'content-studio',
    slug: 'content-studio',
    name: 'AI Content Studio',
    tier: 'ai',
    price: 'R199/mo',
    icon: 'pencil',
    emoji: '✍️',
    tagline: 'Posts, captions, emails and blogs — on brand, on demand.',
    description:
      'Generate social posts, email newsletters, blog articles and ad copy in your brand voice — or essays and project write-ups when you need a head start. Schedule straight to your channels.',
    features: [
      'Social posts & captions',
      'Email newsletters',
      'Blog & ad copy',
      'Brand voice settings',
      'Content calendar'
    ],
    ai: true,
    categories: ['personal', 'business', 'students']
  },
  {
    id: 'website-builder',
    slug: 'website-builder',
    name: 'AI Website Builder',
    tier: 'ai',
    price: 'R299/mo',
    icon: 'globe',
    emoji: '🌐',
    tagline: 'A professional website, built by AI from your answers.',
    description:
      'Tell the builder about your business — or your portfolio — and get a complete website: pages, copy and contact forms. Edit it yourself or let AI update it by chat.',
    features: [
      'AI-generated site in minutes',
      'Mobile responsive',
      'Edit by chat',
      'Contact forms',
      'Free hosting on your subdomain'
    ],
    ai: true,
    categories: ['personal', 'business', 'students']
  },
  {
    id: 'form-builder',
    slug: 'form-builder',
    name: 'AI Form Builder',
    tier: 'ai',
    price: 'R149/mo',
    icon: 'check-circle',
    emoji: '📋',
    tagline: 'Forms and surveys that build themselves.',
    description:
      'Describe the form you need and AI builds it: applications, enquiries, orders, class surveys. Share the link, collect responses, export the data.',
    features: [
      'AI-generated forms',
      'Custom fields & logic',
      'Embed on any site',
      'Response inbox',
      'CSV export'
    ],
    ai: true,
    categories: ['personal', 'business', 'students']
  },

  // ── Tier 2: Business ───────────────────────────────────────
  {
    id: 'invoice-app',
    slug: 'invoice-app',
    name: 'Invoice & Quote App',
    tier: 'business',
    price: 'R199/mo',
    icon: 'dollar',
    emoji: '🧾',
    tagline: 'Get paid faster. Invoices, quotes and payment reminders.',
    description:
      'Create professional invoices and quotes in seconds — perfect for freelancers and side hustles too. Send by link or email and track what’s paid and what’s overdue, with automatic reminders.',
    features: [
      'Professional invoice templates',
      'Quotes that convert to invoices',
      'Automatic payment reminders',
      'Payment status tracking',
      'PDF + WhatsApp/email sending'
    ],
    ai: false,
    categories: ['personal', 'business']
  },
  {
    id: 'simple-crm',
    slug: 'simple-crm',
    name: 'Simple CRM',
    tier: 'business',
    price: 'R199/mo',
    icon: 'user',
    emoji: '🤝',
    tagline: 'Never lose a lead again.',
    description:
      'Track leads, customers and follow-ups in one simple place. Know who to call and when.',
    features: [
      'Lead & customer pipeline',
      'Follow-up reminders',
      'Deal value tracking',
      'Notes & contact history',
      'Team collaboration'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'stock-inventory',
    slug: 'stock-inventory',
    name: 'Stock & Inventory',
    tier: 'business',
    price: 'R149/mo',
    icon: 'box',
    emoji: '📦',
    tagline: 'Know what you have, what’s low, what to reorder.',
    description:
      'Track stock levels, suppliers and reorders. Get low-stock alerts before you run out.',
    features: [
      'Stock levels per item',
      'Low-stock alerts',
      'Supplier records',
      'Purchase orders',
      'Stock movement history'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'small-team-hr',
    slug: 'small-team-hr',
    name: 'Small Team HR',
    tier: 'business',
    price: 'R149/mo',
    icon: 'users',
    emoji: '👥',
    tagline: 'Staff records, leave and payslips — simple.',
    description:
      'Employee records, leave tracking and payslip records for small teams, without the HR department cost.',
    features: [
      'Employee profiles',
      'Leave requests & balance',
      'Payslip records',
      'Documents per employee',
      'Contract expiry alerts'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'booking-calendar',
    slug: 'booking-calendar',
    name: 'Booking & Calendar',
    tier: 'business',
    price: 'R149/mo',
    icon: 'calendar-check',
    emoji: '📅',
    tagline: 'Let clients book themselves — 24/7.',
    description:
      'A booking page your clients — or friends and family — can use any time. Syncs with your calendar, sends reminders, cuts no-shows.',
    features: [
      'Self-service booking page',
      'Calendar sync',
      'Automatic reminders',
      'No-show reduction',
      'Multiple services & staff'
    ],
    ai: false,
    categories: ['personal', 'business']
  },

  // ── Tier 3: Vertical ───────────────────────────────────────
  {
    id: 'school-admin',
    slug: 'school-admin',
    name: 'School Admin',
    tier: 'vertical',
    price: 'R299–R499/mo',
    icon: 'book',
    emoji: '🏫',
    tagline: 'Pupils, fees, parents and reports — one system.',
    description:
      'Built for pre-primary and small schools: pupil records, fee tracking, parent communication and reports.',
    features: [
      'Pupil & guardian records',
      'Fee tracking & statements',
      'Parent communication',
      'Class lists & reports',
      'Term calendar'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'church-manager',
    slug: 'church-manager',
    name: 'Church / Org Manager',
    tier: 'vertical',
    price: 'R299/mo',
    icon: 'shield',
    emoji: '⛪',
    tagline: 'Members, giving, events and teams — organised.',
    description:
      'Manage membership, giving records, events and volunteer teams for churches and community organisations.',
    features: [
      'Member directory',
      'Giving & pledge records',
      'Events & ministries',
      'Volunteer teams',
      'Communication tools'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'property-manager',
    slug: 'property-manager',
    name: 'Property Manager',
    tier: 'vertical',
    price: 'R299/mo',
    icon: 'home',
    emoji: '🏠',
    tagline: 'Properties, tenants and maintenance — under control.',
    description:
      'Track properties, tenants, leases and maintenance requests in one place. Know your income and vacancies at a glance.',
    features: [
      'Property & unit records',
      'Tenant & lease tracking',
      'Rent & income records',
      'Maintenance requests',
      'Vacancy overview'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'salon-booking',
    slug: 'salon-booking',
    name: 'Salon / Clinic Booking',
    tier: 'vertical',
    price: 'R199/mo',
    icon: 'calendar',
    emoji: '💇',
    tagline: 'Appointments, clients and reminders — done.',
    description:
      'Online booking for salons, clinics and studios. Clients book themselves, you get the calendar.',
    features: [
      'Client self-booking',
      'Staff & service management',
      'Appointment reminders',
      'Client history',
      'No-show reduction'
    ],
    ai: false,
    categories: ['business']
  },
  {
    id: 'sports-club-manager',
    slug: 'sports-club-manager',
    name: 'Sports Club Manager',
    tier: 'vertical',
    price: 'R149/mo',
    icon: 'trophy',
    emoji: '⚽',
    tagline: 'Members, fixtures, subs and teams — one app.',
    description:
      'Run your club: membership, subscriptions, fixtures, teams and communication with players and parents.',
    features: [
      'Member & player records',
      'Subscription tracking',
      'Fixtures & results',
      'Team management',
      'Club communication'
    ],
    ai: false,
    categories: ['business']
  }
]

export const getProduct = (slug) => PRODUCTS.find((p) => p.slug === slug)
export const getTier = (tierId) => TIERS.find((t) => t.id === tierId)
export const getCategory = (catId) => CATEGORIES.find((c) => c.id === catId)
export const productsByTier = (tierId) => PRODUCTS.filter((p) => p.tier === tierId)
export const productsByCategory = (catId) => PRODUCTS.filter((p) => (p.categories || []).includes(catId))
