// DGI NIF Verification Service — FactureSmart Sprint 1
// [COD-56] Refactorisé: VITE_DGI_API_KEY supprimée du frontend
// Appels API réels via Edge Function /api-dgi-proxy (server-side)
// La vraie clé DGI_API_KEY est stockée dans les environment variables Supabase

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';

export interface NIFVerifyRequest {
  nif: string;
  companyName?: string;
  email?: string;
}

export interface NIFVerifyResponse {
  success: boolean;
  status: 'verified' | 'pending' | 'rejected' | 'not_found';
  nif: string;
  companyName?: string;
  rccm?: string;
  idNat?: string;
  address?: string;
  verifiedAt?: string;
  error?: string;
  mockDelay?: number;
  isMock?: boolean;
}

// Mock database of valid NIFs for testing (development only)
const MOCK_VALID_NIFS: Record<string, Partial<NIFVerifyResponse>> = {
  '123456789012345': {
    companyName: 'Coccinelle SARL',
    rccm: 'RCCM/CD/KIN/2024/12345',
    idNat: '01-1234-56789',
    address: 'Avenue du Commerce, Kinshasa, RDC',
  },
  '987654321098765': {
    companyName: 'CoExpress SAS',
    rccm: 'RCCM/CD/LUB/2024/54321',
    idNat: '02-9876-54321',
    address: 'Boulevard Liberation, Lubumbashi, RDC',
  },
  '555555555555555': {
    companyName: 'Velorix Store SPRL',
    rccm: 'RCCM/CD/KIN/2023/99999',
    idNat: '01-5555-55555',
    address: 'Rue des Usines, Goma, RDC',
  },
};

class DGIService {
  private edgeFunctionUrl: string;
  private useMock: boolean;

  constructor() {
    // [COD-56] Appelle l'Edge Function server-side — la clé API n'est jamais dans le frontend
    this.edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/api-dgi-proxy`;
    // Si pas de Supabase URL configuré, utiliser le mock
    this.useMock = !SUPABASE_URL || !SUPABASE_ANON_KEY;
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch {
      return '';
    }
  }

  /**
   * Verify a NIF with the DGI API via Edge Function proxy
   * [COD-56] — La clé DGI_API_KEY n'est plus dans le frontend
   */
  async verifyNIF(request: NIFVerifyRequest): Promise<NIFVerifyResponse> {
    if (this.useMock) {
      return this.mockVerifyNIF(request);
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'verify-nif',
          nif: request.nif,
          companyName: request.companyName,
          email: request.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si l'Edge Function retourne 503 (clé non configurée), tomber en mock
        if (response.status === 503 && data.isMock) {
          console.warn('[DGI] DGI_API_KEY not configured server-side, using mock');
          return this.mockVerifyNIF(request);
        }
        return {
          success: false,
          status: 'rejected',
          nif: request.nif,
          error: data.error || 'DGI API error',
          isMock: false,
        };
      }

      return {
        success: data.success,
        status: data.status === 'verified' ? 'verified' : data.status,
        nif: request.nif,
        companyName: data.companyName,
        rccm: data.rccm,
        idNat: data.idNat,
        address: data.address,
        verifiedAt: data.verifiedAt,
        isMock: false,
      };
    } catch (err) {
      console.error('[DGI] Network error:', err);
      // Fallback vers mock si erreur réseau
      return this.mockVerifyNIF(request);
    }
  }

  /**
   * Mock NIF verification for development/testing
   * [COD-56] — Toujours disponible pour développement local
   */
  private async mockVerifyNIF(request: NIFVerifyRequest): Promise<NIFVerifyResponse> {
    const delay = 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const { nif } = request;

    if (!nif || !/^\d{15}$/.test(nif)) {
      return {
        success: false,
        status: 'rejected',
        nif,
        error: 'Format NIF invalide — 15 chiffres requis',
        mockDelay: delay,
        isMock: true,
      };
    }

    const mockData = MOCK_VALID_NIFS[nif];
    if (mockData) {
      return {
        success: true,
        status: 'verified',
        nif,
        companyName: mockData.companyName,
        rccm: mockData.rccm,
        idNat: mockData.idNat,
        address: mockData.address,
        verifiedAt: new Date().toISOString(),
        mockDelay: delay,
        isMock: true,
      };
    }

    const rand = Math.random();
    if (rand < 0.7) {
      return {
        success: true,
        status: 'verified',
        nif,
        companyName: `Entreprise-${nif.slice(-4)}`,
        rccm: `RCCM/CD/KIN/2024/${nif.slice(-5)}`,
        idNat: `01-${nif.slice(-4)}-${nif.slice(-5)}`,
        address: 'Kinshasa, RDC',
        verifiedAt: new Date().toISOString(),
        mockDelay: delay,
        isMock: true,
      };
    } else if (rand < 0.9) {
      return {
        success: true,
        status: 'pending',
        nif,
        error: 'Vérification en cours — la DGI analyse votre dossier',
        mockDelay: delay,
        isMock: true,
      };
    } else {
      return {
        success: false,
        status: 'not_found',
        nif,
        error: 'NIF non trouvé dans les registres de la DGI',
        mockDelay: delay,
        isMock: true,
      };
    }
  }

  /**
   * Submit a facture to DGI for validation
   */
  async submitFacture(facture: {
    id: string;
    invoiceNumber: string;
    amount: number;
    date: string;
    clientNif: string;
  }): Promise<{ success: boolean; transmissionId?: string; error?: string }> {
    if (this.useMock) {
      return {
        success: true,
        transmissionId: `DGI-${Date.now()}-${Math.random().toString(36).slice(-6).toUpperCase()}`,
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'submit-facture',
          factureId: facture.id,
          items: [{ description: 'Article', quantite: 1, prixUnitaire: facture.amount, montantTotal: facture.amount }],
          clientNom: facture.clientNif, // Note: en réalité il faudrait le nom du client
          dateFacture: facture.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'DGI submission failed' };
      }

      return { success: true, transmissionId: data.transmissionId };
    } catch {
      return { success: false, error: 'Erreur de connexion à la DGI' };
    }
  }

  /**
   * Check transmission status
   */
  async getTransmissionStatus(transmissionId: string): Promise<{
    status: 'pending' | 'accepted' | 'rejected';
    receiptUrl?: string;
    error?: string;
  }> {
    if (this.useMock) {
      return {
        status: 'accepted',
        receiptUrl: `https://dgi.gouv.cd/receipts/${transmissionId}.pdf`,
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'check-status',
          transmissionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { status: 'pending', error: data.error };
      }

      return {
        status: data.status === 'validated' ? 'accepted' : data.status,
        receiptUrl: data.receiptUrl,
      };
    } catch {
      return { status: 'pending', error: 'Erreur de connexion' };
    }
  }
}

export const dgiService = new DGIService();

// Named export for convenience
export const verifyNIF = (nif: string, companyName?: string) =>
  dgiService.verifyNIF({ nif, companyName });
