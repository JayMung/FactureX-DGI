/**
 * Admin Backoffice Fake Service
 * Provides demo data for the admin backoffice dashboard and company management.
 * All data is FAKE/MOCK — no connection to real clients.
 *
 * Used by: COD-101 — Dashboard KPIs + Gestion Companies
 */

// ============================================================================
// TYPES
// ============================================================================

export type CompanyStatus = 'active' | 'suspended' | 'pending' | 'inactive';
export type CompanyPlan = 'starter' | 'pro' | 'enterprise';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'bank_transfer' | 'cash' | 'card';
export type AuditAction = 'login' | 'create' | 'update' | 'delete' | 'activate' | 'suspend';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Sector = 'commerce' | 'services' | 'industrie' | 'transport' | 'sante' | 'education' | 'construction' | 'alimentation';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  sector: Sector;
  status: CompanyStatus;
  plan: CompanyPlan;
  city: string;
  country: string;
  nif: string;
  rccm: string;
  createdAt: string;
  activatedAt?: string;
  suspendedAt?: string;
  mrr: number;
  totalInvoiced: number;
  totalPaid: number;
  userCount: number;
  invoiceCount: number;
  overdueCount: number;
  lastActivity: string;
  logo?: string;
  address: string;
  postalCode?: string;
  website?: string;
  contactName: string;
  contactTitle: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  clientName: string;
  amount: number;
  currency: 'USD' | 'CDF';
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: number;
  isDgi: boolean;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  companyId: string;
  companyName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: 'USD' | 'CDF';
  method: PaymentMethod;
  paidAt: string;
  reference: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  companyName: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  description: string;
  ipAddress: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  companyId: string;
  companyName: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface DashboardKPIs {
  mrr: number;
  mrrGrowth: number;
  activeCompanies: number;
  activeCompaniesGrowth: number;
  invoicesThisMonth: number;
  invoicesThisMonthGrowth: number;
  conversionRate: number;
  conversionRateGrowth: number;
  totalOverdueAmount: number;
  overdueInvoicesCount: number;
  suspendedCompanies: number;
  newCompaniesThisMonth: number;
}

export interface GrowthDataPoint {
  month: string;
  mrr: number;
  companies: number;
  invoices: number;
}

export interface SectorDistribution {
  sector: Sector;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopCompany {
  id: string;
  name: string;
  mrr: number;
  growth: number;
  sector: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function monthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

// ============================================================================
// FAKE COMPANIES (12 demo companies)
// ============================================================================

export const FAKE_COMPANIES: Company[] = [
  {
    id: 'comp-001',
    name: 'Kin Café SARL',
    email: 'contact@kincafe.cd',
    phone: '+243 81 234 5678',
    sector: 'alimentation',
    status: 'active',
    plan: 'enterprise',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-123456789',
    rccm: 'RCCM-01-A-12345',
    createdAt: monthsAgo(18),
    activatedAt: monthsAgo(17),
    mrr: 2400,
    totalInvoiced: 48500,
    totalPaid: 46200,
    userCount: 8,
    invoiceCount: 156,
    overdueCount: 0,
    lastActivity: daysAgo(1),
    address: '45 Avenue du Commerce, Gombe',
    website: 'https://kincafe.cd',
    contactName: 'Marie Kabongo',
    contactTitle: 'Directrice Générale',
  },
  {
    id: 'comp-002',
    name: 'TechRDC Solutions',
    email: 'info@techrdc.cd',
    phone: '+243 97 345 6789',
    sector: 'services',
    status: 'active',
    plan: 'pro',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-987654321',
    rccm: 'RCCM-01-B-67890',
    createdAt: monthsAgo(12),
    activatedAt: monthsAgo(11),
    mrr: 890,
    totalInvoiced: 12400,
    totalPaid: 10800,
    userCount: 4,
    invoiceCount: 67,
    overdueCount: 2,
    lastActivity: daysAgo(2),
    address: '12 Rue des Aviateurs, Lingwala',
    website: 'https://techrdc.cd',
    contactName: 'Jean-Pierre Mbuyi',
    contactTitle: 'PDG',
  },
  {
    id: 'comp-003',
    name: 'TransPort Lubumbashi',
    email: 'admin@transport-lsh.cd',
    phone: '+243 82 456 7890',
    sector: 'transport',
    status: 'active',
    plan: 'pro',
    city: 'Lubumbashi',
    country: 'RD Congo',
    nif: 'NIF-456789123',
    rccm: 'RCCM-02-A-11111',
    createdAt: monthsAgo(8),
    activatedAt: monthsAgo(7),
    mrr: 650,
    totalInvoiced: 8900,
    totalPaid: 7500,
    userCount: 3,
    invoiceCount: 43,
    overdueCount: 1,
    lastActivity: daysAgo(3),
    address: '78 Boulevard Kamalondo',
    contactName: 'François Mulamba',
    contactTitle: 'Gérant',
  },
  {
    id: 'comp-004',
    name: 'Clinique Espoir',
    email: 'direction@cliniqueespoir.cd',
    phone: '+243 84 567 8901',
    sector: 'sante',
    status: 'active',
    plan: 'starter',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-321654987',
    rccm: 'RCCM-01-C-22222',
    createdAt: monthsAgo(6),
    activatedAt: monthsAgo(5),
    mrr: 290,
    totalInvoiced: 3200,
    totalPaid: 2800,
    userCount: 2,
    invoiceCount: 28,
    overdueCount: 0,
    lastActivity: daysAgo(5),
    address: '15 Avenue de la Paix, Binza',
    contactName: 'Dr. Aimé Ngalula',
    contactTitle: 'Médecin Chef',
  },
  {
    id: 'comp-005',
    name: 'BatiConstruct SARL',
    email: 'contact@baticonstruct.cd',
    phone: '+243 99 678 9012',
    sector: 'construction',
    status: 'suspended',
    plan: 'pro',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-654987321',
    rccm: 'RCCM-01-D-33333',
    createdAt: monthsAgo(14),
    activatedAt: monthsAgo(12),
    suspendedAt: daysAgo(12),
    mrr: 0,
    totalInvoiced: 15600,
    totalPaid: 12000,
    userCount: 5,
    invoiceCount: 89,
    overdueCount: 7,
    lastActivity: daysAgo(12),
    address: '34 Rue du Batiment, Matete',
    contactName: 'Pierre Kabamba',
    contactTitle: 'Administrateur',
  },
  {
    id: 'comp-006',
    name: 'Ecole Lumière',
    email: 'secretariat@ecole-lumiere.cd',
    phone: '+243 81 789 0123',
    sector: 'education',
    status: 'active',
    plan: 'starter',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-789123456',
    rccm: 'RCCM-01-E-44444',
    createdAt: monthsAgo(4),
    activatedAt: monthsAgo(3),
    mrr: 190,
    totalInvoiced: 1800,
    totalPaid: 1600,
    userCount: 2,
    invoiceCount: 15,
    overdueCount: 0,
    lastActivity: daysAgo(7),
    address: '5 Rue de l\'Ecole, Ngaba',
    contactName: 'Sœur Marie-Claire',
    contactTitle: 'Directrice',
  },
  {
    id: 'comp-007',
    name: 'MegaBoutique Goma',
    email: 'gerant@megaboutique-goma.cd',
    phone: '+243 97 890 1234',
    sector: 'commerce',
    status: 'active',
    plan: 'enterprise',
    city: 'Goma',
    country: 'RD Congo',
    nif: 'NIF-147258369',
    rccm: 'RCCM-03-A-55555',
    createdAt: monthsAgo(20),
    activatedAt: monthsAgo(19),
    mrr: 1800,
    totalInvoiced: 67200,
    totalPaid: 64000,
    userCount: 12,
    invoiceCount: 234,
    overdueCount: 1,
    lastActivity: daysAgo(1),
    address: '12 Boulevard du 17 Novembre',
    website: 'https://megaboutique.cd',
    contactName: 'Alphonse Safari',
    contactTitle: 'Directeur Commercial',
  },
  {
    id: 'comp-008',
    name: 'AfriTech Industries',
    email: 'ceo@afriTech-ind.com',
    phone: '+243 82 901 2345',
    sector: 'industrie',
    status: 'active',
    plan: 'pro',
    city: 'Lubumbashi',
    country: 'RD Congo',
    nif: 'NIF-258369147',
    rccm: 'RCCM-02-B-66666',
    createdAt: monthsAgo(10),
    activatedAt: monthsAgo(9),
    mrr: 1200,
    totalInvoiced: 28900,
    totalPaid: 24500,
    userCount: 6,
    invoiceCount: 98,
    overdueCount: 3,
    lastActivity: daysAgo(4),
    address: 'Zone Industrielle, Kampemba',
    website: 'https://afriTech-ind.com',
    contactName: 'Robert Kankolongo',
    contactTitle: 'CEO',
  },
  {
    id: 'comp-009',
    name: 'FreshFood Distribution',
    email: 'info@freshfood-dist.cd',
    phone: '+243 84 012 3456',
    sector: 'alimentation',
    status: 'pending',
    plan: 'starter',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-369147258',
    rccm: 'RCCM-01-F-77777',
    createdAt: daysAgo(3),
    mrr: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    userCount: 1,
    invoiceCount: 0,
    overdueCount: 0,
    lastActivity: daysAgo(3),
    address: 'Marché Central, Rez-de-chaussée',
    contactName: 'Christine Mbombo',
    contactTitle: 'Responsable',
  },
  {
    id: 'comp-010',
    name: 'SpeedLogistics RDC',
    email: 'dispatch@speedlogistics.cd',
    phone: '+243 99 123 4567',
    sector: 'transport',
    status: 'active',
    plan: 'pro',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-741852963',
    rccm: 'RCCM-01-G-88888',
    createdAt: monthsAgo(7),
    activatedAt: monthsAgo(6),
    mrr: 750,
    totalInvoiced: 11200,
    totalPaid: 9800,
    userCount: 4,
    invoiceCount: 54,
    overdueCount: 2,
    lastActivity: daysAgo(2),
    address: '56 Avenue du 24 Novembre, Selembao',
    website: 'https://speedlogistics.cd',
    contactName: 'Michel TSH',
    contactTitle: 'Directeur des Opérations',
  },
  {
    id: 'comp-011',
    name: 'Digital Hub Kinshasa',
    email: 'hello@digitalhub-kinshasa.cd',
    phone: '+243 97 234 5678',
    sector: 'services',
    status: 'inactive',
    plan: 'starter',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-852963741',
    rccm: 'RCCM-01-H-99999',
    createdAt: monthsAgo(15),
    activatedAt: monthsAgo(14),
    mrr: 0,
    totalInvoiced: 4200,
    totalPaid: 3500,
    userCount: 2,
    invoiceCount: 31,
    overdueCount: 4,
    lastActivity: daysAgo(45),
    address: '3 Rue de la Tech, Silicon District',
    contactName: 'Patrick Bwanga',
    contactTitle: 'Fondateur',
  },
  {
    id: 'comp-012',
    name: 'Pharmacie Plus',
    email: 'admin@pharmacieplus-rdc.cd',
    phone: '+243 81 345 6789',
    sector: 'sante',
    status: 'active',
    plan: 'pro',
    city: 'Kinshasa',
    country: 'RD Congo',
    nif: 'NIF-963852741',
    rccm: 'RCCM-01-I-10101',
    createdAt: monthsAgo(9),
    activatedAt: monthsAgo(8),
    mrr: 580,
    totalInvoiced: 9800,
    totalPaid: 8900,
    userCount: 3,
    invoiceCount: 72,
    overdueCount: 1,
    lastActivity: daysAgo(3),
    address: '88 Boulevard du 30 Juin',
    website: 'https://pharmacieplus-rdc.cd',
    contactName: 'Dr. Grace Muzalia',
    contactTitle: 'Pharmacienne Titulaire',
  },
];

// ============================================================================
// FAKE INVOICES (55 invoices cross-company)
// ============================================================================

const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const CURRENCIES: ('USD' | 'CDF')[] = ['USD', 'USD', 'USD', 'CDF'];

function generateInvoices(): Invoice[] {
  const invoices: Invoice[] = [];
  const clientNames = [
    'Société Générale du Congo', 'Congo Trading SARL', 'Africa Import-Export',
    'Global Services Kinshasa', 'Comptoir du Nord', 'Bureau d\'Etudes Kappa',
    'Entreprises Tshibangu', 'Congo Minerals Corp', 'La Maison du BTP',
    'Pharma Central Africa', 'Hotel Memling', 'Air Congo Aviation',
  ];

  let idx = 1;
  for (const company of FAKE_COMPANIES.filter(c => c.status !== 'pending')) {
    const count = randomBetween(3, 8);
    for (let i = 0; i < count; i++) {
      const daysOffset = randomBetween(1, 180);
      const issueDate = daysAgo(daysOffset);
      const dueDate = new Date(new Date(issueDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const isPaid = Math.random() > 0.35;
      const status: InvoiceStatus = isPaid
        ? (Math.random() > 0.15 ? 'paid' : 'overdue')
        : (Math.random() > 0.5 ? 'sent' : 'draft');

      invoices.push({
        id: `inv-${String(idx).padStart(4, '0')}`,
        invoiceNumber: `FS-${new Date(issueDate).getFullYear()}-${String(idx).padStart(5, '0')}`,
        companyId: company.id,
        companyName: company.name,
        clientName: clientNames[idx % clientNames.length],
        amount: randomBetween(50, 5000),
        currency: CURRENCIES[idx % CURRENCIES.length],
        status,
        issueDate,
        dueDate,
        paidDate: isPaid ? dueDate : undefined,
        items: randomBetween(1, 8),
        isDgi: Math.random() > 0.3,
      });
      idx++;
    }
  }
  return invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export const FAKE_INVOICES: Invoice[] = generateInvoices();

// ============================================================================
// FAKE PAYMENTS (35 payments)
// ============================================================================

const PAYMENT_METHODS: PaymentMethod[] = ['mobile_money', 'bank_transfer', 'cash', 'card'];

function generatePayments(): Payment[] {
  const payments: Payment[] = [];
  const paidInvoices = FAKE_INVOICES.filter(i => i.status === 'paid' && i.paidDate);

  let idx = 1;
  for (const invoice of paidInvoices) {
    payments.push({
      id: `pay-${String(idx).padStart(4, '0')}`,
      paymentNumber: `PAY-${new Date(invoice.paidDate!).getFullYear()}-${String(idx).padStart(5, '0')}`,
      companyId: invoice.companyId,
      companyName: invoice.companyName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      method: PAYMENT_METHODS[idx % PAYMENT_METHODS.length],
      paidAt: invoice.paidDate!,
      reference: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    });
    idx++;
    if (idx > 35) break;
  }
  return payments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
}

export const FAKE_PAYMENTS: Payment[] = generatePayments();

// ============================================================================
// FAKE AUDIT LOGS (40 logs)
// ============================================================================

const AUDIT_ACTIONS: AuditAction[] = ['login', 'create', 'update', 'delete', 'activate', 'suspend'];
const AUDIT_DESCRIPTIONS: Record<AuditAction, string[]> = {
  login: ['Connexion réussie', 'Connexion depuis mobile', 'Connexion depuis nouvel appareil'],
  create: ['Création de facture', 'Création de client', 'Création d\'utilisateur'],
  update: ['Modification de facture', 'Mise à jour du profil entreprise', 'Changement de plan'],
  delete: ['Suppression de brouillon', 'Suppression de client'],
  activate: ['Activation du compte entreprise', 'Réactivation après suspension'],
  suspend: ['Suspension pour non-paiement', 'Suspension manuelle par admin'],
};

function generateAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = [];
  const ips = ['102.78.45.12', '197.234.156.89', '41.243.12.34', '196.1.98.234', '105.178.45.67'];

  let idx = 1;
  for (const company of FAKE_COMPANIES) {
    const count = randomBetween(2, 5);
    for (let i = 0; i < count; i++) {
      const action = AUDIT_ACTIONS[idx % AUDIT_ACTIONS.length];
      logs.push({
        id: `log-${String(idx).padStart(4, '0')}`,
        companyId: company.id,
        companyName: company.name,
        userId: `user-${randomBetween(1, 20)}`,
        userEmail: `admin@${company.email.split('@')[1]}`,
        action,
        description: AUDIT_DESCRIPTIONS[action][idx % AUDIT_DESCRIPTIONS[action].length],
        ipAddress: ips[idx % ips.length],
        timestamp: randomDate(new Date(daysAgo(60)), new Date()),
      });
      idx++;
    }
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const FAKE_AUDIT_LOGS: AuditLog[] = generateAuditLogs();

// ============================================================================
// FAKE SUPPORT TICKETS (18 tickets)
// ============================================================================

const TICKET_SUBJECTS = [
  'Problème de connexion à l\'API DGI',
  'Demande d\'augmentation du quota utilisateurs',
  'Facture non envoyée par email',
  'Erreur lors de l\'export PDF',
  'Question sur la migration des données',
  'Demande de formation pour nouveaux utilisateurs',
  'Problème de paiement mobile money',
  'Demande de personnalisation du template facture',
  'Signalement de bug sur la liste des clients',
  'Question sur le module comptable',
];

function generateTickets(): SupportTicket[] {
  const statuses: SupportTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'medium', 'high', 'urgent'];

  return Array.from({ length: 18 }, (_, i) => ({
    id: `ticket-${String(i + 1).padStart(4, '0')}`,
    ticketNumber: `TKT-${2026}-${String(i + 1).padStart(4, '0')}`,
    companyId: FAKE_COMPANIES[i % FAKE_COMPANIES.length].id,
    companyName: FAKE_COMPANIES[i % FAKE_COMPANIES.length].name,
    subject: TICKET_SUBJECTS[i % TICKET_SUBJECTS.length],
    description: `Description détaillée du ticket ${i + 1}. Le client rencontre ce problème depuis quelques jours et cela impacte son activité.`,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    createdAt: randomDate(new Date(daysAgo(30)), new Date()),
    updatedAt: randomDate(new Date(daysAgo(15)), new Date()),
    assignedTo: i % 3 === 0 ? undefined : ['Jean Admin', 'Marie Support', 'Pierre Tech'][i % 3],
  }));
}

export const FAKE_SUPPORT_TICKETS: SupportTicket[] = generateTickets();

// ============================================================================
// KPI CALCULATIONS
// ============================================================================

export function getDashboardKPIs(): DashboardKPIs {
  const activeCompanies = FAKE_COMPANIES.filter(c => c.status === 'active');
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const invoicesThisMonth = FAKE_INVOICES.filter(i => new Date(i.issueDate) >= thisMonth);
  const paidInvoices = FAKE_INVOICES.filter(i => i.status === 'paid');
  const overdue = FAKE_INVOICES.filter(i => i.status === 'overdue');

  return {
    mrr: activeCompanies.reduce((sum, c) => sum + c.mrr, 0),
    mrrGrowth: 12.5,
    activeCompanies: activeCompanies.length,
    activeCompaniesGrowth: 8.3,
    invoicesThisMonth: invoicesThisMonth.length,
    invoicesThisMonthGrowth: 15.2,
    conversionRate: paidInvoices.length > 0
      ? Math.round((paidInvoices.length / FAKE_INVOICES.length) * 100 * 10) / 10
      : 0,
    conversionRateGrowth: 3.1,
    totalOverdueAmount: overdue.reduce((sum, i) => sum + i.amount, 0),
    overdueInvoicesCount: overdue.length,
    suspendedCompanies: FAKE_COMPANIES.filter(c => c.status === 'suspended').length,
    newCompaniesThisMonth: FAKE_COMPANIES.filter(c => new Date(c.createdAt) >= thisMonth).length,
  };
}

export function getGrowthData(): GrowthDataPoint[] {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();

  return Array.from({ length: 12 }, (_, i) => {
    const monthIndex = (currentMonth - 11 + i + 12) % 12;
    const base = 4500 + (i * 180);
    return {
      month: months[monthIndex],
      mrr: i === 11 ? getDashboardKPIs().mrr : base + randomBetween(-200, 300),
      companies: 6 + i,
      invoices: 40 + (i * 8) + randomBetween(-5, 10),
    };
  });
}

export function getSectorDistribution(): SectorDistribution[] {
  const sectors: { sector: Sector; label: string; color: string }[] = [
    { sector: 'commerce', label: 'Commerce', color: '#22c55e' },
    { sector: 'services', label: 'Services', color: '#06b6d4' },
    { sector: 'transport', label: 'Transport', color: '#f59e0b' },
    { sector: 'sante', label: 'Santé', color: '#ef4444' },
    { sector: 'education', label: 'Éducation', color: '#8b5cf6' },
    { sector: 'industrie', label: 'Industrie', color: '#6366f1' },
    { sector: 'construction', label: 'Construction', color: '#f97316' },
    { sector: 'alimentation', label: 'Alimentation', color: '#ec4899' },
  ];

  const counts = FAKE_COMPANIES.reduce((acc, c) => {
    acc[c.sector] = (acc[c.sector] || 0) + 1;
    return acc;
  }, {} as Record<Sector, number>);

  const total = FAKE_COMPANIES.length;
  return sectors.map(s => ({
    ...s,
    count: counts[s.sector] || 0,
    percentage: Math.round(((counts[s.sector] || 0) / total) * 100),
  })).filter(s => s.count > 0);
}

export function getTopCompanies(): TopCompany[] {
  return [...FAKE_COMPANIES]
    .filter(c => c.status === 'active' && c.mrr > 0)
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      name: c.name,
      mrr: c.mrr,
      growth: randomBetween(-5, 25),
      sector: c.sector,
    }));
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class AdminBackofficeService {
  // Companies
  async getCompanies(filters?: {
    search?: string;
    status?: CompanyStatus;
    plan?: CompanyPlan;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Company[]> {
    await delay(200);
    let results = [...FAKE_COMPANIES];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    if (filters?.status) {
      results = results.filter(c => c.status === filters.status);
    }
    if (filters?.plan) {
      results = results.filter(c => c.plan === filters.plan);
    }
    if (filters?.dateFrom) {
      results = results.filter(c => new Date(c.createdAt) >= new Date(filters.dateFrom!));
    }
    if (filters?.dateTo) {
      results = results.filter(c => new Date(c.createdAt) <= new Date(filters.dateTo!));
    }

    return results;
  }

  async getCompany(id: string): Promise<Company | null> {
    await delay(150);
    return FAKE_COMPANIES.find(c => c.id === id) || null;
  }

  async activateCompany(id: string): Promise<void> {
    await delay(300);
    const company = FAKE_COMPANIES.find(c => c.id === id);
    if (company) {
      company.status = 'active';
      company.activatedAt = new Date().toISOString();
      company.suspendedAt = undefined;
      company.mrr = company.plan === 'starter' ? 190 : company.plan === 'pro' ? 650 : 1200;
    }
  }

  async suspendCompany(id: string): Promise<void> {
    await delay(300);
    const company = FAKE_COMPANIES.find(c => c.id === id);
    if (company) {
      company.status = 'suspended';
      company.suspendedAt = new Date().toISOString();
      company.mrr = 0;
    }
  }

  async deleteCompany(id: string): Promise<void> {
    await delay(300);
    const idx = FAKE_COMPANIES.findIndex(c => c.id === id);
    if (idx !== -1) FAKE_COMPANIES.splice(idx, 1);
  }

  // Invoices
  async getCompanyInvoices(companyId: string): Promise<Invoice[]> {
    await delay(150);
    return FAKE_INVOICES.filter(i => i.companyId === companyId);
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    await delay(150);
    return FAKE_INVOICES.filter(i => i.status === 'overdue');
  }

  // Audit Logs
  async getCompanyAuditLogs(companyId: string): Promise<AuditLog[]> {
    await delay(150);
    return FAKE_AUDIT_LOGS.filter(l => l.companyId === companyId);
  }

  async getRecentAuditLogs(limit = 20): Promise<AuditLog[]> {
    await delay(150);
    return FAKE_AUDIT_LOGS.slice(0, limit);
  }

  // Support Tickets
  async getCompanyTickets(companyId: string): Promise<SupportTicket[]> {
    await delay(150);
    return FAKE_SUPPORT_TICKETS.filter(t => t.companyId === companyId);
  }

  async getOpenTickets(): Promise<SupportTicket[]> {
    await delay(150);
    return FAKE_SUPPORT_TICKETS.filter(t => t.status === 'open' || t.status === 'in_progress');
  }

  // Dashboard
  async getKPIs(): Promise<DashboardKPIs> {
    await delay(200);
    return getDashboardKPIs();
  }

  async getAllInvoices(): Promise<Invoice[]> {
    await delay(150);
    return [...FAKE_INVOICES];
  }

  async getAllPayments(): Promise<Payment[]> {
    await delay(150);
    return [...FAKE_PAYMENTS];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const adminBackofficeService = new AdminBackofficeService();
