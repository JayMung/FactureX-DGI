/**
 * API Endpoint: POST /api-dgi-proxy
 * 
 * Proxy server-side pour l'API DGI RDC.
 * La clé DGI_API_KEY est stockée côté serveur (environment variable)
 * et n'est JAMAIS exposée au frontend.
 * 
 * Le frontend appelle cette Edge Function avec le NIF ou les données de facture,
 * la fonction fait appel à la vraie API DGI avec la clé secrète.
 * 
 * Si DGI_API_KEY n'est pas configurée, retourne une erreur claire —
 * ne jamais simuler silencieusement en production.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DGI_API_URL = Deno.env.get('DGI_API_URL') || 'https://sandbox.dgi.gouv.cd/api/v1';
const DGI_API_KEY = Deno.env.get('DGI_API_KEY') || '';
const IS_MOCK = !DGI_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-organization-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// DRC TVA rates
const TVA_RATES: Record<string, number> = { A: 0, B: 0.08, C: 0.16 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { action, ...data } = body;

    // Validate action
    if (!action || !['verify-nif', 'submit-facture', 'check-status'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing action. Must be: verify-nif, submit-facture, or check-status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check API key is configured for non-mock operations
    if (IS_MOCK) {
      return new Response(
        JSON.stringify({
          error: 'DGI_API_KEY not configured on server. Cannot process DGI requests.',
          hint: 'Set DGI_API_KEY environment variable in Supabase Edge Functions settings.',
          isMock: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to appropriate handler
    switch (action) {
      case 'verify-nif':
        return await handleVerifyNIF(data, corsHeaders);
      case 'submit-facture':
        return await handleSubmitFacture(data, corsHeaders);
      case 'check-status':
        return await handleCheckStatus(data, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (err) {
    console.error('[api-dgi-proxy] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleVerifyNIF(data: { nif: string; companyName?: string; email?: string }, corsHeaders: Record<string, string>) {
  const { nif, companyName, email } = data;

  if (!nif || !/^\d{15}$/.test(nif)) {
    return new Response(
      JSON.stringify({ error: 'Invalid NIF format — 15 digits required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch(`${DGI_API_URL}/nif/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DGI_API_KEY}`,
        'X-API-Key': DGI_API_KEY,
      },
      body: JSON.stringify({ nif, company_name: companyName, email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      return new Response(
        JSON.stringify({ success: false, error: error.message || 'DGI API error', status: 'rejected' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({
        success: true,
        status: result.status === 'active' ? 'verified' : 'pending',
        nif,
        companyName: result.company_name,
        rccm: result.rccm,
        idNat: result.id_nat,
        address: result.address,
        verifiedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Network error: ${err.message}`, status: 'rejected' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleSubmitFacture(data: {
  typeDgi?: string;
  groupeTva?: string;
  items: Array<{ description: string; quantite: number; prixUnitaire: number; montantTotal: number }>;
  clientNom: string;
  dateFacture: string;
  factureId?: string;
  totalHtva?: number;
  totalTtc?: number;
}, corsHeaders: Record<string, string>) {
  const { typeDgi = 'FV', groupeTva = 'C', items, clientNom, dateFacture } = data;

  if (!items || items.length === 0) {
    return new Response(
      JSON.stringify({ error: 'items array is required with at least 1 item' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!clientNom || clientNom.trim().length < 2) {
    return new Response(
      JSON.stringify({ error: 'clientNom is required (min 2 characters)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate totals
  const tauxTva = TVA_RATES[groupeTva] || 0.16;
  const totalHtva = data.totalHtva ?? items.reduce((s, i) => s + (i.montantTotal || 0), 0);
  const montantTva = totalHtva * tauxTva;
  const totalTtc = data.totalTtc ?? totalHtva + montantTva;

  try {
    const response = await fetch(`${DGI_API_URL}/factures/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DGI_API_KEY}`,
        'X-API-Key': DGI_API_KEY,
      },
      body: JSON.stringify({
        type_dgi: typeDgi,
        groupe_tva: groupeTva,
        items: items.map((item, idx) => ({
          numero: idx + 1,
          description: item.description,
          quantite: item.quantite,
          prix_unitaire: item.prixUnitaire,
          montant_total: item.montantTotal,
        })),
        client_nom: clientNom,
        date_facture: dateFacture,
        totals: { htva: totalHtva, tva: montantTva, ttc: totalTtc },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      return new Response(
        JSON.stringify({ success: false, error: error.message || 'DGI submission failed' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({
        success: true,
        numeroDgi: result.numero_dgi,
        codeAuth: result.code_autorisation,
        qrCodeData: result.qr_data,
        transmissionId: result.transmission_id,
        signature: result.signature,
        totals: { htva: totalHtva, tauxTva, tva: montantTva, ttc: totalTtc },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Network error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCheckStatus(data: { transmissionId?: string; numeroDgi?: string }, corsHeaders: Record<string, string>) {
  const { transmissionId, numeroDgi } = data;

  if (!transmissionId && !numeroDgi) {
    return new Response(
      JSON.stringify({ error: 'transmissionId or numeroDgi is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const queryParam = transmissionId ? `transmission_id=${transmissionId}` : `numero_dgi=${numeroDgi}`;

  try {
    const response = await fetch(`${DGI_API_URL}/factures/status?${queryParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DGI_API_KEY}`,
        'X-API-Key': DGI_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({
        success: true,
        transmissionId,
        numeroDgi: numeroDgi || result.numero_dgi,
        status: result.status, // pending, validated, rejected
        receiptUrl: result.receipt_url,
        validatedAt: result.validated_at,
        rejectionReason: result.rejection_reason,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Network error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
