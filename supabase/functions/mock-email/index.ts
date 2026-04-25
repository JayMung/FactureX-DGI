/**
 * [FAKE] Mock Email Service (Resend API Simulation)
 * POST /mock-email/send
 * 
 * Simulates Resend transactional email API.
 * Logic: 90% success, 5% random error, 5% validation error.
 * Random delay 200-1500ms.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  randomDelay,
  generateTxId,
  successResponse,
  errorResponse,
  shouldSimulateError,
} from "../_shared/mock-common.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// In-memory email store (for verification/debugging)
const sentEmails = new Map<string, {
  id: string;
  to: string;
  subject: string;
  from: string;
  createdAt: number;
  status: "sent" | "failed" | "bounced";
  provider: string;
}>();

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop() ?? "";

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify(errorResponse("METHOD_NOT_ALLOWED", "Only POST supported")),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();

  // Simulate random server error (5%)
  if (shouldSimulateError(0.05)) {
    await randomDelay(500, 1500);
    return new Response(
      JSON.stringify(errorResponse("SERVER_ERROR", "Erreur serveur email — tentative ultérieure")),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify(errorResponse("INVALID_JSON", "Body must be valid JSON")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { to, subject, html, from, replyTo } = body as {
    to?: string;
    subject?: string;
    html?: string;
    from?: string;
    replyTo?: string;
  };

  // Validation
  if (!to) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "to est requis")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!validateEmail(to)) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "Format email destinataire invalide")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (!subject) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "subject est requis")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Random delay to simulate network
  await randomDelay(200, 1500);

  // Simulate 5% bounce rate
  if (Math.random() < 0.05) {
    const id = `mock_${generateTxId("EM")}`;
    sentEmails.set(id, {
      id,
      to,
      subject,
      from: from || "FactureSmart <noreply@facturesmart.com>",
      createdAt: Date.now(),
      status: "bounced",
      provider: "mock-resend",
    });
    return new Response(
      JSON.stringify(errorResponse("EMAIL_BOUNCED", "Destinataire introuvable ou boîte pleine")),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Success
  const emailId = `mock_${generateTxId("EM")}`;
  const emailRecord = {
    id: emailId,
    to,
    subject,
    from: from || "FactureSmart <noreply@facturesmart.com>",
    createdAt: Date.now(),
    status: "sent" as const,
    provider: "mock-resend",
  };
  sentEmails.set(emailId, emailRecord);

  return new Response(
    JSON.stringify({
      ...successResponse({
        id: emailId,
        from: emailRecord.from,
        to,
        subject,
        createdAt: emailRecord.createdAt,
      }),
      responseTimeMs: Date.now() - startTime,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
