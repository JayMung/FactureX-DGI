// DGI NIF Verification Service — FactureSmart Sprint 1
//
// MOCK IMPLEMENTATION — À remplacer par l'appel réel à l'API DGI
// une fois les credentials récupérés (COD-26).
//
// API DGI réelle : https://api.dgi.gouv.cd
// Endpoint NIF : POST /api/v1/nif/verify

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
  // Mock delay simulation
  mockDelay?: number;
}

// Mock database of valid NIFs for testing
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
    address: ' Boulevard Liberation, Lubumbashi, RDC',
  },
  '555555555555555': {
    companyName: 'Velorix Store SPRL',
    rccm: 'RCCM/CD/KIN/2023/99999',
    idNat: '01-5555-55555',
    address: 'Rue des Usines, Goma, RDC',
  },
};

class DGIService {
  private baseUrl: string;
  private apiKey: string;
  private isMock: boolean;

  constructor() {
    this.baseUrl = import.meta.env.VITE_DGI_API_URL || 'https://sandbox.dgi.gouv.cd';
    this.apiKey = import.meta.env.VITE_DGI_API_KEY || '';
    // Use mock if no real API key configured
    this.isMock = !this.apiKey;
  }

  /**
   * Verify a NIF with the DGI API (or mock)
   */
  async verifyNIF(request: NIFVerifyRequest): Promise<NIFVerifyResponse> {
    if (this.isMock) {
      return this.mockVerifyNIF(request);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/nif/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          nif: request.nif,
          company_name: request.companyName,
          email: request.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          status: 'rejected',
          nif: request.nif,
          error: error.message || 'DGI API error',
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status === 'active' ? 'verified' : 'pending',
        nif: request.nif,
        companyName: data.company_name,
        rccm: data.rccm,
        idNat: data.id_nat,
        address: data.address,
        verifiedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[DGI] Network error:', err);
      return {
        success: false,
        status: 'rejected',
        nif: request.nif,
        error: 'Erreur de connexion à la DGI',
      };
    }
  }

  /**
   * Mock NIF verification for development/testing
   * Simulates network delay and various responses
   */
  private async mockVerifyNIF(request: NIFVerifyRequest): Promise<NIFVerifyResponse> {
    // Simulate network delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const { nif } = request;

    // Validate NIF format (15 digits for RDC)
    if (!nif || !/^\d{15}$/.test(nif)) {
      return {
        success: false,
        status: 'rejected',
        nif,
        error: 'Format NIF invalide — 15 chiffres requis',
        mockDelay: delay,
      };
    }

    // Check mock database
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
      };
    }

    // For unknown NIFs, simulate random verification result
    // 70% verified, 20% pending, 10% not_found
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
      };
    } else if (rand < 0.9) {
      return {
        success: true,
        status: 'pending',
        nif,
        error: 'Vérification en cours — la DGI analyse votre dossier',
        mockDelay: delay,
      };
    } else {
      return {
        success: false,
        status: 'not_found',
        nif,
        error: 'NIF non trouvé dans les registres de la DGI',
        mockDelay: delay,
      };
    }
  }

  /**
   * Check verification status for a previously submitted NIF
   */
  async getVerificationStatus(companyId: string): Promise<{
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    error?: string;
  }> {
    if (this.isMock) {
      // Mock: instant verification
      return { status: 'verified', verifiedAt: new Date().toISOString() };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/nif/status/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      return {
        status: data.status === 'active' ? 'verified' : 'pending',
        verifiedAt: data.verified_at,
        error: data.error,
      };
    } catch {
      return { status: 'pending', error: 'Erreur de connexion' };
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
    if (this.isMock) {
      // Mock: always succeeds with fake transmission ID
      return {
        success: true,
        transmissionId: `DGI-${Date.now()}-${Math.random().toString(36).slice(-6).toUpperCase()}`,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/factures/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(facture),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || 'Transmission failed' };
      }

      return { success: true, transmissionId: data.transmission_id };
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
    if (this.isMock) {
      return {
        status: 'accepted',
        receiptUrl: `https://dgi.gouv.cd/receipts/${transmissionId}.pdf`,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/factures/status/${transmissionId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      return {
        status: data.status,
        receiptUrl: data.receipt_url,
        error: data.error,
      };
    } catch {
      return { status: 'pending', error: 'Erreur de connexion' };
    }
  }
}

export const dgiService = new DGIService();
