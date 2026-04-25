/**
 * [FAKE] Mock WhatsApp Business API (Meta Cloud API Simulation)
 * POST /mock-whatsapp/send
 * 
 * Simulates WhatsApp Cloud API for sending messages.
 * Supports: text messages, document (PDF) sending.
 * Logic: 90% success, 5% random error, 5% invalid phone.
 * Random delay 300-2000ms.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  randomDelay,
  generateTxId,
  normalizePhone,
  isValidRdcPhone,
  successResponse,
  errorResponse,
  shouldSimulateError,
} from "../_shared/mock-common.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-organization-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// In-memory message store
const sentMessages = new Map<string, {
  id: string;
  to: string;
  type: "text" | "document" | "image";
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: number;
  provider: string;
}>();

function generateWAMessageId(): string {
  return `wamid.${Date.now()}${Math.random().toString().slice(2, 12)}`;
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
    await randomDelay(500, 2000);
    return new Response(
      JSON.stringify(errorResponse("SERVER_ERROR", "Erreur serveur WhatsApp — tentative ultérieure")),
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

  const { messaging_product, to, type, text, document } = body as {
    messaging_product?: string;
    to?: string;
    type?: string;
    text?: { body: string };
    document?: { link: string; caption: string; filename: string };
  };

  // Validate messaging_product
  if (messaging_product !== "whatsapp") {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "messaging_product must be 'whatsapp'")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate phone
  if (!to) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "to (phone number) est requis")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const normalizedPhone = normalizePhone(to);
  if (!isValidRdcPhone(normalizedPhone)) {
    // Try without strict validation — some international numbers
    if (!/^\+?[0-9]{10,15}$/.test(to.replace(/\s/g, ""))) {
      return new Response(
        JSON.stringify(errorResponse("INVALID_PHONE", `Numéro WhatsApp invalide: ${to}`)),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Validate message type
  if (!["text", "document", "image"].includes(type || "")) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "type must be 'text', 'document', or 'image'")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate content based on type
  if (type === "text" && (!text || !text.body)) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "text.body est requis pour les messages texte")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if ((type === "document" || type === "image") && (!document || !document.link)) {
    return new Response(
      JSON.stringify(errorResponse("VALIDATION_ERROR", "document.link est requis pour les documents/images")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Random delay
  await randomDelay(300, 2000);

  // Simulate phone not on WhatsApp (3%)
  if (Math.random() < 0.03) {
    const msgId = `wamid.${generateTxId("HB")}`;
    sentMessages.set(msgId, {
      id: msgId,
      to: normalizedPhone,
      type: type as "text" | "document" | "image",
      status: "failed",
      createdAt: Date.now(),
      provider: "mock-whatsapp",
    });
    return new Response(
      JSON.stringify(errorResponse("PHONE_NOT_ON_WHATSAPP", "Le destinataire n'est pas sur WhatsApp")),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Success
  const messageId = `wamid.${generateTxId("HB")}`;
  const msgRecord = {
    id: messageId,
    to: normalizedPhone,
    type: type as "text" | "document" | "image",
    status: "sent" as const,
    createdAt: Date.now(),
    provider: "mock-whatsapp",
  };
  sentMessages.set(messageId, msgRecord);

  return new Response(
    JSON.stringify({
      ...successResponse({
        messaging_product: "whatsapp",
        contacts: [{ wa_id: normalizedPhone.replace("+", "") }],
        messages: [{
          id: messageId,
          messaging_product: "whatsapp",
          status: "sent",
        }],
      }),
      responseTimeMs: Date.now() - startTime,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
