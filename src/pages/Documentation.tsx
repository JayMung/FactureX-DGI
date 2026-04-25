"use client";

import { useState, useRef, useEffect } from 'react';
import { usePageSetup } from '@/hooks/use-page-setup';
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Users, 
  Settings, 
  BarChart3, 
  Calculator,
  Shield,
  FileCode,
  ArrowRight,
  ChevronDown,
  Search,
  Menu,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Smartphone,
  Globe,
  RefreshCw,
  Receipt,
  Download,
  Printer,
  Building2,
  Banknote,
  Package,
  ScrollText,
  BookMarked,
  Scale,
  TrendingUp,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ─── Types ───────────────────────────────────────────────────────────
interface DocSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  content: React.ReactNode;
}

// ─── Guide Sections ──────────────────────────────────────────────────
const GUIDE_SECTIONS: DocSection[] = [
  {
    id: 'introduction',
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Introduction',
    description: 'Découvrez FactureSmart et ses fonctionnalités',
    content: (
      <div className="space-y-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bienvenue sur FactureSmart</h3>
          <p className="text-gray-600 dark:text-gray-300">
            FactureSmart est une solution complète de gestion d'entreprise conçue pour les PME en République Démocratique du Congo. 
            Elle vous permet de gérer vos factures, clients, transactions, caisse, et comptabilité — le tout en conformité avec les 
            normes SYSCOHADA et l'intégration DGI (Direction Générale des Impôts).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: FileText, label: 'Facturation électronique', desc: 'Créez, gérez et envoyez des factures conformes DGI' },
            { icon: Users, label: 'Gestion clients', desc: 'Base de données clients complète avec historique' },
            { icon: Calculator, label: 'Comptabilité OHADA', desc: 'Plan comptable, journal, balance, états financiers' },
            { icon: Banknote, label: 'Gestion de caisse', desc: 'Ouverture/fermeture, transferts, journal de caisse' },
            { icon: BarChart3, label: 'Rapports & analyses', desc: 'Tableaux de bord et rapports détaillés' },
            { icon: Shield, label: 'Conforme DGI-RDC', desc: 'Factures électroniques conformes à la réglementation' },
          ].map((item) => (
            <Card key={item.label} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Prérequis techniques</h4>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Navigateur moderne (Chrome, Firefox, Edge, Safari)</li>
                <li>Connexion Internet stable</li>
                <li>Numéro d'identification fiscal (NIF) RDC pour la facturation DGI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'facturation',
    icon: <FileText className="w-5 h-5" />,
    title: 'Facturation',
    description: 'Gérer vos factures, devis, et conformité DGI',
    content: (
      <div className="space-y-6">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="create-facture">
            <AccordionTrigger className="text-base font-semibold">
              Créer une facture
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>Allez dans <strong>Factures</strong> depuis le menu latéral</li>
                  <li>Cliquez sur <Badge variant="outline" className="mx-1">Nouvelle facture</Badge></li>
                  <li>Sélectionnez un client (ou créez-en un)</li>
                  <li>Ajoutez les articles/services avec leurs prix</li>
                  <li>Définissez les paramètres : type de facture DGI (FV, EV, FT), groupe TVA</li>
                  <li>Vérifiez le récapitulatif et cliquez sur <Badge variant="default" className="mx-1">Valider</Badge></li>
                </ol>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Types de factures DGI</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { code: 'FV', label: 'Facture de Vente', desc: 'Vente de biens' },
                      { code: 'EV', label: 'Facture d\'Avoir', desc: 'Note de crédit' },
                      { code: 'FT', label: 'Facture de Travail', desc: 'Prestation de services' },
                      { code: 'FA', label: 'Facture d\'Acompte', desc: 'Paiement anticipé' },
                    ].map((t) => (
                      <div key={t.code} className="bg-white dark:bg-gray-700 rounded p-2 border border-gray-200 dark:border-gray-600">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{t.code}</span>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{t.label}</p>
                        <p className="text-[10px] text-gray-400">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dgi-conformity">
            <AccordionTrigger className="text-base font-semibold">
              Conformité DGI
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  FactureSmart est intégré à l'API DGI-RDC pour la validation fiscale automatique des factures.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-green-800 dark:text-green-200">Processus automatique</h5>
                      <ol className="mt-2 list-decimal list-inside space-y-1 text-green-700 dark:text-green-300">
                        <li>Création de la facture dans FactureSmart</li>
                        <li>Validation de la facture</li>
                        <li>Envoi automatique à la DGI via API</li>
                        <li>Réception d'un code d'autorisation unique</li>
                        <li>Génération du QR code fiscal</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="devis">
            <AccordionTrigger className="text-base font-semibold">
              Devis
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Créez des devis pour vos prospects, convertissez-les en factures en un clic.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Les devis peuvent être envoyés par email ou téléchargés en PDF</li>
                  <li>Un devis accepté peut être transformé en facture directement</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  {
    id: 'clients',
    icon: <Users className="w-5 h-5" />,
    title: 'Gestion des clients',
    description: 'Gérez votre base de données clients',
    content: (
      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Gérer vos clients</h3>
          <p>La section Clients vous permet de centraliser toutes les informations de vos clients et de suivre leur historique.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fonctionnalités</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {[
                  'Ajout/modification/suppression de clients',
                  'Recherche et filtrage avancés',
                  'Historique des achats et transactions',
                  'Export de la liste clients (CSV/PDF)',
                  'Import en masse depuis Excel',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations client</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {[
                  'Nom, prénom, téléphone, email',
                  'Ville, adresse, NIF (si applicable)',
                  'Total payé et historique',
                  'Catégorisation client',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: 'transactions',
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Transactions',
    description: 'Suivez toutes vos entrées et sorties d\'argent',
    content: (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="types">
            <AccordionTrigger className="text-base font-semibold">Types de transactions</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Revenus', desc: 'Entrées d\'argent', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                  { label: 'Dépenses', desc: 'Sorties d\'argent', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Transferts', desc: 'Mouvements entre comptes', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                ].map((t) => (
                  <div key={t.label} className={`${t.bg} rounded-lg p-3 border`}>
                    <span className={`font-semibold text-sm ${t.color}`}>{t.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="filter">
            <AccordionTrigger className="text-base font-semibold">Filtres et recherche</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>La page Transactions offre des filtres avancés :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Par statut : Servi, En attente, Annulé</li>
                  <li>Par devise : USD, CDF</li>
                  <li>Par période : aujourd'hui, cette semaine, ce mois, personnalisé</li>
                  <li>Par montant : min/max</li>
                  <li>Par client</li>
                  <li>Par moyen de paiement : Mobile Money, Espèces, Virement, etc.</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="export">
            <AccordionTrigger className="text-base font-semibold">Export et rapports</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Exportez vos transactions :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Format CSV pour analyse dans Excel/Google Sheets</li>
                  <li>Format PDF pour archivage</li>
                  <li>Rapports périodiques automatiques (quotidien, hebdomadaire, mensuel)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  {
    id: 'comptabilite',
    icon: <Calculator className="w-5 h-5" />,
    title: 'Comptabilité SYSCOHADA',
    description: 'Tenue comptable complète aux normes OHADA',
    content: (
      <div className="space-y-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-gray-600 dark:text-gray-300">
            FactureSmart intègre un module comptable complet conforme au système SYSCOHADA OHADA, 
            utilisé dans toute la zone CEMAC/CIMA en Afrique.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: BookOpen, label: 'Plan comptable', desc: 'Comptes PC1 à PC8 conformes OHADA' },
            { icon: ScrollText, label: 'Journal', desc: 'Saisie des écritures chronologiques' },
            { icon: BookMarked, label: 'Grand Livre', desc: 'Détail de chaque compte' },
            { icon: Scale, label: 'Balance', desc: 'Balance générale des comptes' },
            { icon: BarChart3, label: 'États financiers', desc: 'Bilan, CPC, TRÉSORERIE' },
            { icon: TrendingUp, label: 'Trésorerie', desc: 'Situation de trésorerie K7' },
            { icon: Landmark, label: 'Relevé bancaire', desc: 'Rapprochement K8' },
            { icon: FileCode, label: 'Export OHADA', desc: 'Export aux normes K9' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Note importante</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Les modules comptables sont disponibles uniquement pour les rôles <strong>Admin</strong> et <strong>Comptable</strong>.
                Vous devez avoir un plan comptable généré avant de commencer la saisie.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'caisse',
    icon: <Banknote className="w-5 h-5" />,
    title: 'Gestion de caisse',
    description: 'Gérez vos sessions de caisse et encaissements',
    content: (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="sessions">
            <AccordionTrigger className="text-base font-semibold">Sessions de caisse</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Ouverture :</strong> Démarrez une session avec un fonds de caisse initial</li>
                  <li><strong>Journal :</strong> Consultez toutes les opérations de la session en cours</li>
                  <li><strong>Transfert :</strong> Transférez des fonds entre caisses (admin/comptable)</li>
                  <li><strong>Fermeture :</strong> Clôturez la session avec le solde final</li>
                </ol>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    💡 <strong>Conseil :</strong> Ouvrez une session chaque matin et fermez-la chaque soir pour un suivi rigoureux.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pos">
            <AccordionTrigger className="text-base font-semibold">Point de Vente (POS)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Le module POS permet des encaissements rapides :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sélection rapide des articles</li>
                  <li>Paiements multiples (espèces, Mobile Money, Orange Money, Airtel Money)</li>
                  <li>Génération de ticket de caisse</li>
                  <li>Historique des ventes POS</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
  {
    id: 'articles',
    icon: <Package className="w-5 h-5" />,
    title: 'Articles et stocks',
    description: 'Gérez vos articles et produits',
    content: (
      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <p>La section <strong>Articles</strong> vous permet de gérer l'inventaire de vos produits et services :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Création d'articles avec prix de vente et/ou prix d'achat</li>
          <li>Catégorisation des articles</li>
          <li>Suivi des stocks disponibles</li>
          <li>Articles utilisés automatiquement dans la création de factures</li>
          <li>Import/export en masse</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'rapports',
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Rapports et analyses',
    description: 'Tableaux de bord et indicateurs de performance',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Dashboard', desc: 'Vue d\'ensemble : CA, transactions, tendances' },
            { label: 'Rapports de vente', desc: 'Analyse détaillée des ventes par période' },
            { label: 'Rapports clients', desc: 'Top clients, fidélité, segmentation' },
            { label: 'Rapports fiscaux', desc: 'TVA collectée, déclarations DGI' },
          ].map((r) => (
            <div key={r.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{r.label}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'parametres',
    icon: <Settings className="w-5 h-5" />,
    title: 'Paramètres',
    description: 'Configuration de votre compte et entreprise',
    content: (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="company">
            <AccordionTrigger className="text-base font-semibold">Informations entreprise</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Configurez les informations de votre entreprise :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nom, logo, devise par défaut</li>
                  <li>NIF, RC, ID Nat, adresse</li>
                  <li>Numéro d'agrément DGI (si applicable)</li>
                  <li>Informations bancaires</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="facture-prefs">
            <AccordionTrigger className="text-base font-semibold">Préférences facturation</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Numérotation automatique des factures</li>
                  <li>Délai de paiement par défaut</li>
                  <li>Template PDF personnalisé</li>
                  <li>Paramètres DGI (type de facture par défaut)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="team">
            <AccordionTrigger className="text-base font-semibold">Gestion d'équipe</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Gérez les utilisateurs de votre organisation :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Admin :</strong> Accès complet à toutes les fonctionnalités</li>
                  <li><strong>Comptable :</strong> Accès aux modules comptables et transactions</li>
                  <li><strong>Caissier :</strong> Accès à la caisse et aux encaissements</li>
                  <li>Invitation par email, gestion des permissions</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
  },
];


// ─── Main Component ──────────────────────────────────────────────────
export default function Documentation() {
  usePageSetup({ title: 'Documentation', subtitle: 'Guide complet de FactureSmart' });

  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState(GUIDE_SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scroll-based active section detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('section-', ''));
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

  const filteredSections = GUIDE_SECTIONS.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Table of Contents — Sidebar on desktop */}
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

          {/* Nav items */}
          <nav className="space-y-0.5">
            {GUIDE_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
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
              id={`section-${section.id}`}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="scroll-mt-24"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">{section.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
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
