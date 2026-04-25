/**
 * API Endpoint: POST /api-team-invite
 *
 * Crée une invitation d'équipe et envoie un email.
 * Sécurisé : seuls les admins d'une entreprise peuvent inviter.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "FactureSmart <noreply@facturesmart.com>";
const APP_URL = Deno.env.get("APP_URL") || "https://facturesmart.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-organization-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InvitePayload {
  companyId: string;
  email: string;
  role: "admin" | "comptable" | "caissier" | "viewer";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse payload
    const payload: InvitePayload = await req.json();
    const { companyId, email, role } = payload;

    if (!companyId || !email || !role) {
      return new Response(
        JSON.stringify({ error: "companyId, email, et role requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the caller is an admin of this company
    const { data: caller, error: callerError } = await supabaseClient
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();

    if (callerError || !caller || !["super_admin", "admin"].includes(caller.role)) {
      return new Response(
        JSON.stringify({ error: "Seuls les admins peuvent inviter" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check company member limit
    const { data: company } = await supabaseClient
      .from("companies")
      .select("name, max_team_members")
      .eq("id", companyId)
      .single();

    const { count: activeCount } = await supabaseClient
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active");

    if (company && activeCount && activeCount >= company.max_team_members) {
      return new Response(
        JSON.stringify({
          error: `Limite d'équipe atteinte (${company.max_team_members} membres max)`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already exists in team
    const { data: existing } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("email", email)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Cet email est déjà membre de l'équipe" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("team_invitations")
      .insert({
        company_id: companyId,
        email,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Insert invitation error:", inviteError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'invitation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare invitation email
    const inviterName = (await supabaseClient
      .from("team_members")
      .select("full_name")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single()).data?.full_name || user.email;

    const roleLabels: Record<string, string> = {
      admin: "Administrateur",
      comptable: "Comptable",
      caissier: "Caissier",
      viewer: "Lecteur",
    };

    const acceptUrl = `${APP_URL}/accept-invitation?token=${invitation.token}`;
    const companyName = company?.name || "votre entreprise";

    // Send email via Resend API
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: `Invitation à rejoindre ${companyName} sur FactureSmart`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Invitation à rejoindre</h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 18px;">${companyName}</p>
    </div>
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Bonjour,</p>
      <p style="color: #374151; font-size: 16px;">
        <strong>${inviterName}</strong> vous a invité à rejoindre 
        <strong>${companyName}</strong> sur FactureSmart avec le rôle 
        <strong>${roleLabels[role]}</strong>.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" 
           style="display: inline-block; background: #2563eb; color: white; 
                  padding: 14px 32px; border-radius: 8px; text-decoration: none; 
                  font-size: 16px; font-weight: 600;">
          Accepter l'invitation
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        Ce lien expire dans 7 jours.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px;">
        Si vous n'avez pas demandé cette invitation, ignorez cet email.
        <br>FactureSmart — Facturation intelligente pour la RDC
      </p>
    </div>
  </div>
</body>
</html>`,
        }),
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text();
        console.error("Resend API error:", emailError);
        // Don't fail — invitation is created even if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expires_at: invitation.expires_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
