// ============================================================================
// FactureSmart-DGI Phase 0 — Cleaned Types
// Removed: colis, transitaires, granular permissions, CNY currency,
// activity logs, workflow approvals, complex financial reports
// ============================================================================

// --------------------------------------------------------------------------
// Client
// --------------------------------------------------------------------------
export interface Client {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  ville: string;
  adresse?: string;
  pays?: string;
  nif?: string;           // Numéro d'Identification Fiscale (DGI)
  notes?: string;
  type?: 'particulier' | 'entreprise';
  total_paye?: number;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export interface ClientFilters {
  search?: string;
  ville?: string;
}

export interface CreateClientData {
  nom: string;
  telephone: string;
  email?: string;
  ville: string;
  adresse?: string;
  nif?: string;
  notes?: string;
  type?: 'particulier' | 'entreprise';
}

// --------------------------------------------------------------------------
// Article (POS catalog)
// --------------------------------------------------------------------------
export interface Article {
  id: string;
  denomination: string;
  code_barres?: string;
  prix: number;
  groupe_tva: 'A' | 'B' | 'C';
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// Transaction (simplified - no CNY, no swap)
// --------------------------------------------------------------------------
export interface Transaction {
  id: string;
  client_id?: string;
  motif?: string;
  type_transaction: 'revenue' | 'depense' | 'transfert';
  montant: number;
  devise: 'USD' | 'CDF';
  mode_paiement?: string;
  statut: 'en_attente' | 'valide' | 'annule';
  frais?: number;
  date_paiement: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  client?: Client;
}

export interface TransactionFilters {
  search?: string;
  statut?: string;
  devise?: string;
  clientId?: string;
  modePaiement?: string;
  type_transaction?: 'revenue' | 'depense' | 'transfert';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface CreateTransactionData {
  type_transaction: 'revenue' | 'depense' | 'transfert';
  motif?: string;
  client_id?: string;
  montant: number;
  devise: 'USD' | 'CDF';
  mode_paiement?: string;
  date_paiement?: string;
  statut?: string;
  frais?: number;
  notes?: string;
}

export interface UpdateTransactionData {
  type_transaction?: 'revenue' | 'depense' | 'transfert';
  client_id?: string;
  montant?: number;
  devise?: 'USD' | 'CDF';
  motif?: string;
  mode_paiement?: string;
  date_paiement?: string;
  statut?: string;
  frais?: number;
  notes?: string;
}

// --------------------------------------------------------------------------
// Facture (with DGI fields)
// --------------------------------------------------------------------------
export interface Facture {
  id: string;
  facture_number: string;
  type: 'devis' | 'facture';
  statut: 'brouillon' | 'en_attente' | 'validee' | 'payee' | 'annulee';
  client_id?: string;
  date_emission: string;
  date_validation?: string;
  date_echeance?: string | null;
  valide_par?: string;
  devise: 'USD' | 'CDF';
  subtotal: number;
  frais?: number;
  total_general: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  // DGI fields
  type_dgi?: 'standard' | 'simplifie' | 'normal';
  groupe_tva?: 'A' | 'B' | 'C';
  montant_ht?: number;
  montant_tva?: number;
  montant_ttc?: number;
  numero_dgi?: string;
  code_auth?: string;
  qr_code_data?: string;
  client_nif?: string;
  // Relations
  client?: Client;
  clients?: Client;
  items?: FactureItem[];
}

export interface FactureItem {
  id?: string;
  facture_id?: string;
  numero_ligne: number;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
  created_at?: string;
  tempId?: string;
}

export interface CreateFactureData {
  client_id?: string;
  type: 'devis' | 'facture';
  devise: 'USD' | 'CDF';
  date_emission: string;
  statut?: 'brouillon' | 'en_attente' | 'validee' | 'annulee';
  notes?: string;
  subtotal?: number;
  frais?: number;
  total_general?: number;
  // DGI fields
  type_facture_dgi?: 'FV' | 'EV' | 'FT' | 'ET' | 'FA' | 'EA';
  groupe_tva?: 'A' | 'B' | 'C';
  montant_ht?: number;
  montant_tva?: number;
  montant_ttc?: number;
  numero_dgi?: string;
  code_auth?: string;
  qr_code_data?: string;
  items: Omit<FactureItem, 'id' | 'facture_id' | 'created_at'>[];
  frais_transport_douane?: number;
  total_poids?: number;
  created_by?: string;
}

export interface UpdateFactureData {
  client_id?: string;
  devise?: 'USD' | 'CDF';
  date_emission?: string;
  statut?: 'brouillon' | 'en_attente' | 'validee' | 'annulee';
  notes?: string;
  subtotal?: number;
  frais?: number;
  total_general?: number;
  // DGI fields
  type_facture_dgi?: 'FV' | 'EV' | 'FT' | 'ET' | 'FA' | 'EA';
  groupe_tva?: 'A' | 'B' | 'C';
  montant_ht?: number;
  montant_tva?: number;
  montant_ttc?: number;
  numero_dgi?: string;
  code_auth?: string;
  qr_code_data?: string;
  frais_transport_douane?: number;
  total_poids?: number;
  items?: Omit<FactureItem, 'id' | 'facture_id' | 'created_at'>[];
}

export interface FactureFilters {
  search?: string;
  type?: 'devis' | 'facture';
  statut?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// --------------------------------------------------------------------------
// Declarant DGI (tax registration)
// --------------------------------------------------------------------------
export interface Declarant {
  id: string;
  raison_sociale: string;
  sigle?: string;
  nif?: string;
  rccm?: string;
  nic?: string;
  dgi_numero?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  banque?: string;
  compte_bancaire?: string;
  periodicite?: 'mensuelle' | 'trimestrielle' | 'annuelle';
  arrondissement?: string;
  centre_impot?: string;
  actif?: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// DGI Declaration
// --------------------------------------------------------------------------
export interface DgiDeclaration {
  id: string;
  declarant_id: string;
  mois: number;
  annee: number;
  nombre_factures?: number;
  total_htva?: number;
  total_tva?: number;
  total_ttc?: number;
  statut?: 'brouillon' | 'soumise' | 'validee' | 'rejetee';
  date_soumission?: string;
  date_validation?: string;
  reference_dgi?: string;
  observations?: string;
  declared_by?: string;
  created_at: string;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// Caisse Session (POS)
// --------------------------------------------------------------------------
export interface CaisseSession {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  fond_initial: number;
  total_ventes: number;
  total_especes: number;
  total_carte: number;
  statut: 'ouverte' | 'fermee';
  created_at: string;
}

// --------------------------------------------------------------------------
// Profile / User
// --------------------------------------------------------------------------
export type Role = 'admin' | 'comptable' | 'caissier';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: Role;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// --------------------------------------------------------------------------
// Payment Method
// --------------------------------------------------------------------------
export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  icon?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------
export interface Setting {
  id: string;
  categorie: string;
  cle: string;
  valeur: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------------------------
// Generic types
// --------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
