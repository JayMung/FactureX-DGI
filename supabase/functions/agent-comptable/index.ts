import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  parseTransaction,
  detectCommand,
  getSoldesActuels,
  getRecentTransactions,
  savePendingTransaction,
  confirmPendingTransaction,
  cancelPendingTransaction,
} from "../_shared/agent-comptable.ts";
import {
  sendTelegramMessage,
  sendSoldes,
  sendTransactionConfirmation,
  answerCallbackQuery,
} from "../_shared/telegram.ts";

const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") || "";

// In-memory pending transaction (per function invocation — for production, use a DB table)
// For now, confirmations are handled via callback_data

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();

    // Telegram sends either a message or a callback_query
    if (body.callback_query) {
      await handleCallback(body.callback_query);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.message?.text) {
      const chatId = String(body.message.chat.id);
      const text = body.message.text;

      // Security: only respond to authorized chat
      if (TELEGRAM_CHAT_ID && chatId !== TELEGRAM_CHAT_ID) {
        console.warn("Unauthorized chat ID:", chatId);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      await handleMessage(chatId, text);
    }

    // For cron invocations via HTTP (internal)
    if (body.action === "morning_point" || body.action === "evening_point") {
      const { morningPoint, eveningPoint } = await import("./cron-handler.ts");
      if (body.action === "morning_point") {
        await morningPoint();
      } else {
        await eveningPoint();
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agent Comptable error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function handleMessage(chatId: string, text: string) {
  console.log("📩 Message reçu:", text);

  // 0. Handle text-based confirmation ("oui", "non", "annuler")
  const lowerText = text.toLowerCase().trim();
  if (lowerText === 'oui' || lowerText === 'ok' || lowerText === 'yes' || lowerText === 'confirmer') {
    try {
      const result = await confirmPendingTransaction(chatId);
      if (result) {
        const emoji = result.type_transaction === 'revenue' ? '💰' : '💸';
        await sendTelegramMessage(
          chatId,
          `${emoji} *Transaction enregistrée !*\n\n• ${result.montant} ${result.devise}\n• ${result.motif}\n\n✅ Sauvegardé dans FactureSmart`
        );
      } else {
        await sendTelegramMessage(chatId, "⏰ Pas de transaction en attente. Envoie-moi un nouveau message.");
      }
    } catch (error) {
      console.error('Error confirming via text:', error);
      await sendTelegramMessage(chatId, "❌ Erreur lors de l'enregistrement. Réessaie.");
    }
    return;
  }
  if (lowerText === 'non' || lowerText === 'annuler' || lowerText === 'cancel') {
    await cancelPendingTransaction(chatId);
    await sendTelegramMessage(chatId, "❌ Annulé.");
    return;
  }

  // 1. Check for commands
  const command = detectCommand(text);
  if (command) {
    await handleCommand(chatId, command.command);
    return;
  }

  // 2. Parse the transaction
  const parsed = parseTransaction(text);

  // 3. If it's a question
  if (parsed.type === "question") {
    const soldes = await getSoldesActuels();
    await sendSoldes(chatId, soldes);
    return;
  }

  // 4. No amount detected
  if (!parsed.montant) {
    await sendTelegramMessage(
      chatId,
      `🤔 Je n'ai pas bien compris le montant.\n\nPeux-tu reformuler ?\n_Ex: "25k essence" ou "500$ vente"_`
    );
    return;
  }

  // 5. Save pending transaction and ask for confirmation
  const txData = {
    type: (parsed.type || "depense") as "depense" | "revenue",
    montant: parsed.montant,
    devise: parsed.devise,
    motif: parsed.motif,
    compte: parsed.compte,
    categorie: parsed.categorie,
  };

  await savePendingTransaction(chatId, txData);
  await sendTransactionConfirmation(chatId, txData);
}

async function handleCommand(chatId: string, command: string) {
  switch (command) {
    case "/solde":
    case "/soldes": {
      const soldes = await getSoldesActuels();
      await sendSoldes(chatId, soldes);
      break;
    }
    case "/historique": {
      const historique = await getRecentTransactions(5);
      let msg = "📜 *DERNIÈRES TRANSACTIONS*\n\n";
      for (const t of historique) {
        const emoji = t.type_transaction === "revenue" ? "💰" : "💸";
        msg += `${emoji} ${t.motif}\n   ${t.montant} ${t.devise}\n   ${new Date(t.date_paiement).toLocaleDateString("fr-FR")}\n\n`;
      }
      await sendTelegramMessage(chatId, msg);
      break;
    }
    case "/aide": {
      const aide =
        `📖 *AIDE - Agent Comptable*\n\n` +
        `*Comment m'utiliser :*\n` +
        `• "25k essence" → Enregistre dépense essence\n` +
        `• "Reçu 500$ client" → Enregistre revenu\n` +
        `• "Solde ?" → Voir les soldes\n\n` +
        `*Points automatiques :*\n` +
        `• 8h00 : Point matinal\n` +
        `• 18h00 : Point du soir\n\n` +
        `*Commandes :*\n` +
        `• /solde - Voir les soldes\n` +
        `• /historique - Dernières transactions\n` +
        `• /aide - Cette aide`;
      await sendTelegramMessage(chatId, aide);
      break;
    }
    default:
      await sendTelegramMessage(
        chatId,
        `🤔 Commande inconnue.\nEssaye /aide pour voir les commandes disponibles.`
      );
  }
}

async function handleCallback(callbackQuery: any) {
  const chatId = String(callbackQuery.message.chat.id);
  const data = callbackQuery.data;
  const callbackId = callbackQuery.id;

  // Always answer the callback to stop the loading spinner
  await answerCallbackQuery(callbackId);

  if (data === "confirm_yes") {
    try {
      const result = await confirmPendingTransaction(chatId);
      if (result) {
        const emoji = result.type_transaction === 'revenue' ? '💰' : '💸';
        await sendTelegramMessage(
          chatId,
          `${emoji} *Transaction enregistrée !*\n\n` +
          `• ${result.montant} ${result.devise}\n` +
          `• ${result.motif}\n\n` +
          `✅ Sauvegardé dans FactureSmart`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "⏰ Cette transaction a expiré. Renvoie-moi le message."
        );
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      await sendTelegramMessage(
        chatId,
        "❌ Erreur lors de l'enregistrement. Réessaie."
      );
    }
  } else if (data === "confirm_edit") {
    await cancelPendingTransaction(chatId);
    await sendTelegramMessage(
      chatId,
      "📝 Renvoie-moi le message corrigé.\n_Ex: \"30k essence mpesa\"_"
    );
  } else if (data === "confirm_cancel") {
    await cancelPendingTransaction(chatId);
    await sendTelegramMessage(chatId, "❌ Annulé.");
  } else if (data === "alert_seen") {
    await sendTelegramMessage(chatId, "👍 Noté !");
  }
}
