"use client";

import { useState, useRef, useEffect } from 'react';
import { usePageSetup } from '@/hooks/use-page-setup';
import {
  Key,
  Globe,
  Server,
  Webhook,
  Code,
  Shield,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Search,
  Terminal,
  Cpu,
  Package,
  ScrollText,
  BookMarked,
  Scale,
  TrendingUp,
  Landmark,
  FileCode,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Constants ───────────────────────────────────────────────────────
const BASE_URL = 'https://ddnxtuhswmewoxrwswzg.supabase.co/functions/v1';

interface EndpointParam {
  name: string;
  type: string;
  description: string;
  example?: string;
}

interface EndpointResponse {
  label: string;
  code: string;
}

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE | PATCH';
  path: string;
  title: string;
  description: string;
  permission: string;
  deprecated?: boolean;
  beta?: boolean;
  params: EndpointParam[];
  responses: EndpointResponse[];
}

// ─── Copy Button ─────────────────────────────────────────────────────
function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-950 text-gray-100 px-4 py-2 rounded-t-lg text-xs font-mono">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-green-400" /> Copié</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copier</>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors[method] || 'bg-gray-100 text-gray-700'}`}>
      {method}
    </span>
  );
}

// ─── Endpoint Card ───────────────────────────────────────────────────
function EndpointCard({ endpoint }: { endpoint: APIEndpoint }) {
  const [showCode, setShowCode] = useState(false);

  const curlExample = `curl -X ${endpoint.method} "${BASE_URL}${endpoint.path}?limit=10" \\\n  -H "X-API-Key: sk_live_votre_clé" \\\n  -H "X-Organization-ID: org_votre_id"`;

  return (
    <Card className="border border-gray-200 dark:border-gray-700" id={`endpoint-${endpoint.path}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <EndpointBadge method={endpoint.method} />
              <code className="text-sm font-mono text-gray-900 dark:text-white font-semibold">{endpoint.path}</code>
              {endpoint.deprecated && (
                <Badge variant="destructive" className="text-[10px]">Deprecated</Badge>
              )}
              {endpoint.beta && (
                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Beta</Badge>
              )}
            </div>
            <CardDescription className="text-sm">{endpoint.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Shield className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">Permission : <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{endpoint.permission}</code></span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Parameters */}
        {endpoint.params.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Paramètres</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Nom</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Type</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Exemple</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((param) => (
                    <tr key={param.name} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-2 font-mono text-xs text-gray-900 dark:text-white">{param.name}</td>
                      <td className="py-2 px-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{param.type}</code>
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-300">{param.description}</td>
                      <td className="py-2 px-2 text-xs text-gray-400">{param.example || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Response */}
        <div>
          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Réponse</h5>
          {endpoint.responses.map((resp) => (
            <div key={resp.label} className="mb-2">
              <p className="text-xs text-gray-500 mb-1">{resp.label}</p>
              <CodeBlock code={resp.code} />
            </div>
          ))}
        </div>

        {/* cURL example */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <Terminal className="w-3.5 h-3.5 mr-1.5" />
            {showCode ? 'Masquer' : 'Voir'} l'exemple cURL
          </Button>
          {showCode && (
            <div className="mt-2">
              <CodeBlock code={curlExample} language="bash" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── API Sections ────────────────────────────────────────────────────
const API_SECTIONS = [
  {
    id: 'introduction',
    icon: <Info className="w-4 h-4" />,
    title: 'Introduction',
    content: (
      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <p>
          L'API FactureSmart permet d'accéder à vos données de manière programmatique pour créer des automatisations, 
          des dashboards personnalisés, ou des intégrations avec des outils tiers comme <strong>n8n</strong>, 
          <strong>Discord</strong>, <strong>Slack</strong>, etc.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            { icon: Server, label: 'RESTful', desc: 'Architecture REST standard' },
            { icon: Key, label: 'Sécurisée', desc: 'Clés API avec permissions granulaires' },
            { icon: Shield, label: 'Rate Limited', desc: 'Protection contre les abus' },
            { icon: Webhook, label: 'Webhooks', desc: 'Notifications en temps réel' },
            { icon: Globe, label: 'Multi-format', desc: 'JSON, Discord, Slack, n8n' },
            { icon: Cpu, label: 'Auto-documenté', desc: 'Réponses avec métadonnées' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Base URL</p>
          <CodeBlock code={BASE_URL} language="text" />
        </div>
      </div>
    ),
  },
  {
    id: 'authentication',
    icon: <Key className="w-4 h-4" />,
    title: 'Authentification',
    content: (
      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Préfixe</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Permissions</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Rate Limit</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Usage</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Public', prefix: 'pk_live_', perms: 'Lecture seule (stats)', limit: '100/h', usage: 'Dashboards publics' },
                { type: 'Secret', prefix: 'sk_live_', perms: 'Lecture + Webhooks', limit: '1000/h', usage: 'Intégrations (n8n, Discord)' },
                { type: 'Admin', prefix: 'ak_live_', perms: 'Accès complet', limit: '5000/h', usage: 'Administration' },
              ].map((row) => (
                <tr key={row.type} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-2 font-semibold text-gray-900 dark:text-white">{row.type}</td>
                  <td className="py-2 px-2 font-mono text-xs text-gray-600">{row.prefix}</td>
                  <td className="py-2 px-2 text-xs">{row.perms}</td>
                  <td className="py-2 px-2 text-xs">{row.limit}</td>
                  <td className="py-2 px-2 text-xs">{row.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Créer une clé API</h4>
              <ol className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Connectez-vous à FactureSmart</li>
                <li>Allez dans <strong>Paramètres &gt; API</strong></li>
                <li>Cliquez sur <strong>Générer une clé</strong></li>
                <li>Choisissez le type et les permissions</li>
                <li><strong>Copiez la clé immédiatement</strong> — elle ne sera plus affichée</li>
              </ol>
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Headers requis</h5>
          <CodeBlock code={`X-API-Key: sk_live_votre_clé_secrète
X-Organization-ID: org_votre_organisation_id
Content-Type: application/json`} language="http" />
        </div>

        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Exemple de requête</h5>
          <CodeBlock code={`curl -X GET "${BASE_URL}/api-transactions?status=Servi&limit=10" \\
  -H "X-API-Key: sk_live_abc123..." \\
  -H "X-Organization-ID: org_xyz789..."`} language="bash" />
        </div>
      </div>
    ),
  },
  {
    id: 'endpoints',
    icon: <Server className="w-4 h-4" />,
    title: 'Endpoints',
    content: (
      <div className="space-y-4">
        {ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.path} endpoint={ep} />
        ))}
      </div>
    ),
  },
  {
    id: 'webhooks',
    icon: <Webhook className="w-4 h-4" />,
    title: 'Webhooks',
    content: (
      <div className="space-y-6">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>Les webhooks permettent de recevoir des notifications en temps réel lorsque des événements se produisent dans FactureSmart.</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Événements disponibles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { event: 'transaction.created', desc: 'Nouvelle transaction créée' },
              { event: 'transaction.validated', desc: 'Transaction passée à "Servi"' },
              { event: 'transaction.deleted', desc: 'Transaction supprimée' },
              { event: 'facture.created', desc: 'Nouvelle facture/devis' },
              { event: 'facture.validated', desc: 'Facture validée' },
              { event: 'facture.paid', desc: 'Facture marquée comme payée' },
              { event: 'client.created', desc: 'Nouveau client ajouté' },
              { event: 'client.updated', desc: 'Client mis à jour' },
            ].map((evt) => (
              <div key={evt.event} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <code className="text-xs font-mono text-green-600 dark:text-green-400">{evt.event}</code>
                <p className="text-xs text-gray-500 mt-0.5">{evt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payload Webhook</h4>
          <CodeBlock code={`{
  "event": "transaction.created",
  "timestamp": "2024-01-20T15:30:00Z",
  "organization_id": "org_123",
  "data": {
    "id": "txn_456",
    "montant": 500,
    "devise": "USD",
    "client": {
      "nom": "Jean Dupont"
    }
  },
  "signature": "sha256=abc123..."
}`} language="json" />
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Vérification HMAC</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Chaque webhook est signé avec HMAC-SHA256. Vérifiez la signature pour vous assurer 
                que l'événement provient bien de FactureSmart.
              </p>
              <CodeBlock code={`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}`} language="javascript" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'integrations',
    icon: <Cpu className="w-4 h-4" />,
    title: 'Intégrations',
    content: (
      <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300">
        <Tabs defaultValue="n8n">
          <TabsList>
            <TabsTrigger value="n8n">n8n</TabsTrigger>
            <TabsTrigger value="discord">Discord</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value="n8n" className="space-y-4 pt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Étape 1 : Configurer les identifiants</h5>
              <ol className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Dans n8n, créez un nouveau <strong>Credential</strong></li>
                <li>Type : <strong>HTTP Header Auth</strong></li>
                <li>Ajoutez les headers : <code>X-API-Key</code> et <code>X-Organization-ID</code></li>
              </ol>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Exemple : Récupérer les transactions du jour</h5>
              <CodeBlock code={`{
  nodes: [
    {
      parameters: {
        url: "${BASE_URL}/api-transactions",
        authentication: "headerAuth",
        options: {
          queryParameters: {
            status: "Servi",
            date_from: "={{ $today }}",
            limit: "100"
          }
        }
      },
      name: "Récupérer Transactions",
      type: "n8n-nodes-base.httpRequest"
    }
  ]
}`} language="json" />
            </div>
          </TabsContent>

          <TabsContent value="discord" className="space-y-4 pt-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notifier un canal Discord</h5>
              <p className="mb-2">Créez un webhook Discord et utilisez l'API FactureSmart avec le format <code>discord</code> :</p>
              <CodeBlock code={`{
  "name": "Alertes Transactions",
  "url": "https://discord.com/api/webhooks/...",
  "events": ["transaction.created", "transaction.validated"],
  "format": "discord",
  "filters": {
    "montant_min": 1000,
    "devise": "USD"
  }
}`} language="json" />
              <p className="mt-2 text-xs text-gray-500">Le payload sera automatiquement formaté en embed Discord.</p>
            </div>
          </TabsContent>

          <TabsContent value="javascript" className="space-y-4 pt-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Exemple JavaScript (fetch)</h5>
              <CodeBlock code={`const API_KEY = 'sk_live_votre_clé';
const ORG_ID = 'org_votre_id';

async function getTransactions() {
  const res = await fetch(
    '${BASE_URL}/api-transactions?limit=10',
    {
      headers: {
        'X-API-Key': API_KEY,
        'X-Organization-ID': ORG_ID,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await res.json();
  return data;
}

// Utilisation
getTransactions().then(console.log);`} language="javascript" />
            </div>
          </TabsContent>

          <TabsContent value="python" className="space-y-4 pt-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Exemple Python (requests)</h5>
              <CodeBlock code={`import requests

API_KEY = 'sk_live_votre_clé'
ORG_ID = 'org_votre_id'

headers = {
    'X-API-Key': API_KEY,
    'X-Organization-ID': ORG_ID,
    'Content-Type': 'application/json',
}

response = requests.get(
    f'{BASE_URL}/api-transactions',
    headers=headers,
    params={'limit': 10}
)

data = response.json()
print(data)`} language="python" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    ),
  },
  {
    id: 'errors',
    icon: <AlertTriangle className="w-4 h-4" />,
    title: 'Gestion des erreurs',
    content: (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Code</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Message</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Cause</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: 400, msg: 'Bad Request', cause: 'Paramètres invalides dans la requête' },
                { code: 401, msg: 'Unauthorized', cause: 'Clé API manquante ou invalide' },
                { code: 403, msg: 'Forbidden', cause: 'Permissions insuffisantes pour cette ressource' },
                { code: 404, msg: 'Not Found', cause: 'Ressource ou endpoint inexistant' },
                { code: 429, msg: 'Too Many Requests', cause: 'Rate limit dépassé, attendre avant de réessayer' },
                { code: 500, msg: 'Internal Server Error', cause: 'Erreur interne, réessayer plus tard' },
              ].map((err) => (
                <tr key={err.code} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-2">
                    <Badge variant={err.code >= 500 ? 'destructive' : err.code >= 400 ? 'outline' : 'secondary'} className="font-mono">
                      {err.code}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-sm text-gray-900 dark:text-white">{err.msg}</td>
                  <td className="py-2 px-2 text-sm text-gray-600 dark:text-gray-300">{err.cause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Exemple de réponse d'erreur</h4>
              <CodeBlock code={`{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "La clé API fournie est invalide ou a expiré",
    "status": 401,
    "details": {
      "key_prefix": "sk_invalid",
      "hint": "Générez une nouvelle clé dans les paramètres"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "documentation_url": "https://docs.facturesmart.com/api"
  }
}`} language="json" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'limits',
    icon: <Shield className="w-4 h-4" />,
    title: 'Limites et quotas',
    content: (
      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Limite</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {[
                { limit: 'Rate limit (Secret)', value: '1000 requêtes/heure' },
                { limit: 'Rate limit (Admin)', value: '5000 requêtes/heure' },
                { limit: 'Rate limit (Public)', value: '100 requêtes/heure' },
                { limit: 'Taille max de requête', value: '1 MB' },
                { limit: 'Timeout', value: '30 secondes' },
                { limit: 'Pagination max', value: '100 résultats par page' },
                { limit: 'Webhooks', value: '50 webhooks par organisation' },
              ].map((r) => (
                <tr key={r.limit} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-2 text-sm text-gray-900 dark:text-white">{r.limit}</td>
                  <td className="py-2 px-2 text-xs">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Headers de rate limit</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Chaque réponse inclut les headers <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, 
                et <code>X-RateLimit-Reset</code> pour suivre votre consommation.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

// ─── Endpoints Data ──────────────────────────────────────────────────
const ENDPOINTS: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/api-transactions',
    title: 'Récupérer les transactions',
    description: 'Récupère les transactions avec filtres avancés.',
    permission: 'read:transactions',
    params: [
      { name: 'status', type: 'string', description: 'Statut de la transaction', example: 'Servi' },
      { name: 'currency', type: 'string', description: 'Devise', example: 'USD' },
      { name: 'client_id', type: 'UUID', description: 'ID du client', example: 'abc-123-def' },
      { name: 'date_from', type: 'date', description: 'Date de début', example: '2024-01-01' },
      { name: 'date_to', type: 'date', description: 'Date de fin', example: '2024-12-31' },
      { name: 'min_amount', type: 'number', description: 'Montant minimum', example: '100' },
      { name: 'max_amount', type: 'number', description: 'Montant maximum', example: '10000' },
      { name: 'motif', type: 'string', description: 'Recherche dans le motif', example: 'Commande' },
      { name: 'type_transaction', type: 'string', description: 'Type', example: 'revenue' },
      { name: 'limit', type: 'number', description: 'Nombre de résultats (max 100)', example: '50' },
      { name: 'offset', type: 'number', description: 'Pagination', example: '0' },
    ],
    responses: [
      {
        label: 'Succès (200)',
        code: `{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "date_paiement": "2024-01-15T10:30:00Z",
        "montant": 500,
        "devise": "USD",
        "motif": "Commande client",
        "frais": 25,
        "benefice": 10,
        "mode_paiement": "Mobile Money",
        "statut": "Servi",
        "type_transaction": "revenue",
        "client": {
          "id": "cli_456",
          "nom": "Jean Dupont",
          "telephone": "+243...",
          "ville": "Kinshasa"
        }
      }
    ]
  },
  "meta": {
    "generated_at": "2024-01-20T15:30:00Z",
    "organization_id": "org_789",
    "response_time_ms": 45
  },
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}`,
      },
    ],
  },
  {
    method: 'GET',
    path: '/api-clients',
    title: 'Récupérer les clients',
    description: 'Récupère la liste des clients avec filtres.',
    permission: 'read:clients',
    params: [
      { name: 'search', type: 'string', description: 'Recherche par nom/téléphone', example: 'Jean' },
      { name: 'ville', type: 'string', description: 'Filtre par ville', example: 'Kinshasa' },
      { name: 'has_transactions', type: 'boolean', description: 'Clients avec transactions', example: 'true' },
      { name: 'min_total', type: 'number', description: 'Montant total minimum', example: '1000' },
      { name: 'limit', type: 'number', description: 'Nombre de résultats (max 100)', example: '50' },
      { name: 'offset', type: 'number', description: 'Pagination', example: '0' },
    ],
    responses: [
      {
        label: 'Succès (200)',
        code: `{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "cli_123",
        "nom": "Jean Dupont",
        "telephone": "+243...",
        "ville": "Kinshasa",
        "total_paye": 5000,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}`,
      },
    ],
  },
  {
    method: 'GET',
    path: '/api-factures',
    title: 'Récupérer les factures',
    description: 'Récupère les factures et devis avec filtres.',
    permission: 'read:factures',
    params: [
      { name: 'type', type: 'string', description: 'Type de document', example: 'facture' },
      { name: 'statut', type: 'string', description: 'Statut de la facture', example: 'validee' },
      { name: 'client_id', type: 'UUID', description: 'ID du client', example: 'abc-123' },
      { name: 'date_from', type: 'date', description: 'Date de début', example: '2024-01-01' },
      { name: 'date_to', type: 'date', description: 'Date de fin', example: '2024-12-31' },
      { name: 'include_items', type: 'boolean', description: 'Inclure les articles', example: 'true' },
      { name: 'limit', type: 'number', description: 'Nombre de résultats (max 100)', example: '50' },
      { name: 'offset', type: 'number', description: 'Pagination', example: '0' },
    ],
    responses: [
      {
        label: 'Succès (200)',
        code: `{
  "success": true,
  "data": {
    "factures": [
      {
        "id": "fac_123",
        "type": "FV",
        "numero": "FACT-2024-0001",
        "client": "Jean Dupont",
        "montant_total": 15000,
        "devise": "CDF",
        "statut": "Validee",
        "dgi_code": "DGI-ABC-123-XYZ"
      }
    ]
  },
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}`,
      },
    ],
  },
  {
    method: 'GET',
    path: '/api-stats',
    title: 'Récupérer les statistiques',
    description: 'Récupère les statistiques du tableau de bord.',
    permission: 'read:stats',
    params: [
      { name: 'period', type: 'string', description: 'Période', example: '30d' },
      { name: 'date_from', type: 'date', description: 'Date de début (si custom)', example: '2024-01-01' },
      { name: 'date_to', type: 'date', description: 'Date de fin (si custom)', example: '2024-12-31' },
      { name: 'group_by', type: 'string', description: 'Groupement', example: 'month' },
      { name: 'currency', type: 'string', description: 'Devise', example: 'USD' },
    ],
    responses: [
      {
        label: 'Succès (200)',
        code: `{
  "success": true,
  "data": {
    "stats": {
      "total_usd": 15000,
      "total_cdf": 5000000,
      "total_frais": 750,
      "total_benefice": 300,
      "nombre_transactions": 45,
      "nombre_clients": 12,
      "evolution": {
        "revenue_change": 15.5,
        "transaction_change": 8.2
      }
    },
    "graph_data": {
      "daily": [
        { "date": "2024-01-15", "revenue": 500, "transactions": 3 }
      ]
    }
  }
}`,
      },
    ],
  },
];

// ─── Main Component ──────────────────────────────────────────────────
export default function APIReference() {
  usePageSetup({ title: 'Référence API', subtitle: 'Guide complet de l\'API REST FactureSmart' });

  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState(API_SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('api-section-', ''));
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const filteredSections = API_SECTIONS.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar TOC */}
      <aside className="lg:w-56 xl:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <nav className="space-y-0.5">
            {API_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(`api-section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left",
                  activeSection === section.id
                    ? "bg-green-50 text-green-600 font-medium dark:bg-green-900/20 dark:text-green-400"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                )}
              >
                <span className="w-4 h-4 flex-shrink-0">{section.icon}</span>
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </nav>

          {/* Quick stats */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Endpoints</span>
              <span className="font-semibold text-gray-900 dark:text-white">{ENDPOINTS.length}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Méthodes</span>
              <span className="font-semibold text-gray-900 dark:text-white">GET</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Version API</span>
              <span className="font-semibold text-gray-900 dark:text-white">v1</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-10 pb-12">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun résultat pour "{search}"</p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <section
              key={section.id}
              id={`api-section-${section.id}`}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">{section.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h2>
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="pl-1">
                {section.content}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}