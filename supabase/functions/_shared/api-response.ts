/**
 * API Response Formatting Utilities
 * Standardized response formatting for all API endpoints
 */

import type { ApiResponse, DiscordEmbed, DiscordWebhookPayload } from './api-types.ts';

// ============================================================================
// Standard API Responses
// ============================================================================

export function successResponse<T>(
  data: T,
  meta?: Record<string, any>,
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  }
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      generated_at: new Date().toISOString(),
      organization_id: meta?.organization_id || '',
      ...meta
    },
    ...(pagination && { pagination })
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: any,
  statusCode: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    },
    meta: {
      generated_at: new Date().toISOString(),
      organization_id: ''
    }
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// ============================================================================
// Error Response Helpers
// ============================================================================

export const Errors = {
  UNAUTHORIZED: (message = 'Invalid or missing API key') => 
    errorResponse('UNAUTHORIZED', message, null, 401),
  
  FORBIDDEN: (message = 'Insufficient permissions') => 
    errorResponse('FORBIDDEN', message, null, 403),
  
  NOT_FOUND: (resource: string) => 
    errorResponse('NOT_FOUND', `${resource} not found`, null, 404),
  
  RATE_LIMIT: (limit: number, window: string) => 
    errorResponse(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded: ${limit} requests per ${window}`,
      { limit, window },
      429
    ),
  
  VALIDATION_ERROR: (details: any) => 
    errorResponse('VALIDATION_ERROR', 'Invalid request parameters', details, 400),
  
  INTERNAL_ERROR: (message = 'Internal server error') => 
    errorResponse('INTERNAL_ERROR', message, null, 500),
  
  WEBHOOK_ERROR: (message: string) => 
    errorResponse('WEBHOOK_ERROR', message, null, 400)
};

// ============================================================================
// Discord Formatting
// ============================================================================

export function formatTransactionForDiscord(transaction: any): DiscordWebhookPayload {
  const color = transaction.statut === 'Servi' ? 3066993 : 15844367; // Green or Orange
  
  const embed: DiscordEmbed = {
    title: `💰 Transaction ${transaction.statut}`,
    color,
    fields: [
      {
        name: '👤 Client',
        value: transaction.client?.nom || 'N/A',
        inline: true
      },
      {
        name: '💵 Montant',
        value: `${transaction.montant} ${transaction.devise}`,
        inline: true
      },
      {
        name: '📊 Bénéfice',
        value: `${transaction.benefice || 0} ${transaction.devise}`,
        inline: true
      },
      {
        name: '📝 Motif',
        value: transaction.motif || 'N/A',
        inline: false
      },
      {
        name: '💳 Mode de paiement',
        value: transaction.mode_paiement || 'N/A',
        inline: true
      },
      {
        name: '📅 Date',
        value: new Date(transaction.date_paiement).toLocaleDateString('fr-FR'),
        inline: true
      }
    ],
    footer: {
      text: 'FactureSmart API'
    },
    timestamp: new Date().toISOString()
  };

  return {
    embeds: [embed],
    username: 'FactureSmart Bot',
  };
}

export function formatFactureForDiscord(facture: any): DiscordWebhookPayload {
  const color = facture.statut === 'validee' ? 3066993 : 15844367;
  
  const embed: DiscordEmbed = {
    title: `📄 ${facture.type === 'facture' ? 'Facture' : 'Devis'} ${facture.statut}`,
    color,
    fields: [
      {
        name: '🔢 Numéro',
        value: facture.facture_number || 'N/A',
        inline: true
      },
      {
        name: '👤 Client',
        value: facture.client?.nom || 'N/A',
        inline: true
      },
      {
        name: '💰 Total',
        value: `${facture.total_general} ${facture.devise}`,
        inline: true
      },
      {
        name: '📦 Articles',
        value: `${facture.items_count || 0} article(s)`,
        inline: true
      },
      {
        name: '📅 Date',
        value: new Date(facture.created_at).toLocaleDateString('fr-FR'),
        inline: true
      }
    ],
    footer: {
      text: 'FactureSmart API'
    },
    timestamp: new Date().toISOString()
  };

  return {
    embeds: [embed],
    username: 'FactureSmart Bot',
  };
}

export function formatClientForDiscord(client: any): DiscordWebhookPayload {
  const embed: DiscordEmbed = {
    title: '👤 Nouveau Client',
    color: 5793266, // Blue
    fields: [
      {
        name: '📛 Nom',
        value: client.nom,
        inline: true
      },
      {
        name: '📞 Téléphone',
        value: client.telephone || 'N/A',
        inline: true
      },
      {
        name: '🌍 Ville',
        value: client.ville || 'N/A',
        inline: true
      },
      {
        name: '💰 Total payé',
        value: `${client.total_paye || 0} USD`,
        inline: true
      }
    ],
    footer: {
      text: 'FactureSmart API'
    },
    timestamp: new Date().toISOString()
  };

  return {
    embeds: [embed],
    username: 'FactureSmart Bot',
  };
}

export function formatStatsForDiscord(stats: any): DiscordWebhookPayload {
  const embed: DiscordEmbed = {
    title: '📊 Statistiques FactureSmart',
    color: 3447003, // Blue
    fields: [
      {
        name: '💵 Total USD',
        value: `$${stats.total_usd?.toFixed(2) || 0}`,
        inline: true
      },
      {
        name: '💴 Total CDF',
        value: `${stats.total_cdf?.toFixed(2) || 0} FC`,
        inline: true
      },
      {
        name: '📈 Bénéfice',
        value: `$${stats.total_benefice?.toFixed(2) || 0}`,
        inline: true
      },
      {
        name: '🔢 Transactions',
        value: `${stats.nombre_transactions || 0}`,
        inline: true
      },
      {
        name: '👥 Clients',
        value: `${stats.nombre_clients || 0}`,
        inline: true
      },
      {
        name: '📅 Période',
        value: stats.period || 'Aujourd\'hui',
        inline: true
      }
    ],
    footer: {
      text: 'FactureSmart API'
    },
    timestamp: new Date().toISOString()
  };

  return {
    embeds: [embed],
    username: 'FactureSmart Bot',
  };
}

// ============================================================================
// n8n Formatting
// ============================================================================

export function formatColisForDiscord(colis: any): DiscordWebhookPayload {
  const color = colis.statut === 'livre' ? 3066993 : 15844367; // Green or Orange
  
  const embed: DiscordEmbed = {
    title: `📦 Colis ${colis.statut === 'livre' ? 'Livré' : 'Mis à jour'}`,
    color,
    fields: [
      {
        name: '👤 Client',
        value: colis.client?.nom || 'N/A',
        inline: true
      },
      {
        name: '🚚 Type',
        value: colis.type_livraison === 'aerien' ? 'Aérien' : 'Maritime',
        inline: true
      },
      {
        name: '📊 Statut',
        value: colis.statut || 'N/A',
        inline: true
      },
      {
        name: '⚖️ Poids',
        value: `${colis.poids || 0} kg`,
        inline: true
      },
      {
        name: '💰 Montant',
        value: `${colis.montant_a_payer || 0} USD`,
        inline: true
      },
      {
        name: '📦 Quantité',
        value: `${colis.quantite || 0} colis`,
        inline: true
      }
    ],
    footer: {
      text: 'FactureSmart API'
    },
    timestamp: new Date().toISOString()
  };

  if (colis.tracking_chine) {
    embed.fields?.push({
      name: '🔍 Tracking',
      value: colis.tracking_chine,
      inline: false
    });
  }

  return {
    embeds: [embed],
    username: 'FactureSmart Bot',
  };
}

export function formatForN8n(data: any, eventType: string): any {
  return {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: data,
    metadata: {
      source: 'facturesmart-api',
      version: '1.0'
    }
  };
}

// ============================================================================
// Slack Formatting (Future)
// ============================================================================

export function formatForSlack(data: any, eventType: string): any {
  // Similar to Discord but with Slack's Block Kit format
  return {
    text: `New ${eventType} event`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${eventType}*\n${JSON.stringify(data, null, 2)}`
        }
      }
    ]
  };
}

// ============================================================================
// Generic Formatter
// ============================================================================

export function formatWebhookPayload(
  data: any,
  eventType: string,
  format: 'json' | 'discord' | 'slack' | 'n8n'
): any {
  switch (format) {
    case 'discord':
      if (eventType.startsWith('transaction')) {
        return formatTransactionForDiscord(data);
      } else if (eventType.startsWith('facture')) {
        return formatFactureForDiscord(data);
      } else if (eventType.startsWith('client')) {
        return formatClientForDiscord(data);
      } else if (eventType.startsWith('colis')) {
        return formatColisForDiscord(data);
      }
      return { content: `New ${eventType} event` };
    
    case 'n8n':
      return formatForN8n(data, eventType);
    
    case 'slack':
      return formatForSlack(data, eventType);
    
    case 'json':
    default:
      return {
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      };
  }
}
