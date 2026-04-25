"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Printer, User, X, Check, Smartphone, Grid3X3, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import type { Client } from '@/types';
import { useAllArticles } from '@/hooks/useArticles';
import { generateNumeroDgi, generateCodeAuth, generateQrCodeData, TVA_RATES } from '@/utils/dgiUtils';

interface CartItem {
  id: string;
  description: string;
  prix_unitaire: number;
  quantite: number;
  montant_total: number;
  groupe_tva?: 'A' | 'B' | 'C';
}

interface POSCart {
  client: Client | null;
  items: CartItem[];
  mode_paiement: 'cash' | 'card' | 'mobile';
  montant_recu: number;
}

export default function POSCaisse() {
  const [cart, setCart] = useState<POSCart>({
    client: null,
    items: [],
    mode_paiement: 'cash',
    montant_recu: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [showArticlePanel, setShowArticlePanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastFacture, setLastFacture] = useState<{number: string; total: number} | null>(null);
  const [printMode, setPrintMode] = useState<'none' | 'preview'>('none');
  const [showCheckout, setShowCheckout] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [dgiInfo, setDgiInfo] = useState<{ numero_dgi: string; code_auth: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { articles, isLoading: articlesLoading } = useAllArticles(articleSearch);

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom, telephone, ville, nif, type')
        .order('nom', { ascending: true });
      if (!error && data) {
        setClients(data);
      }
    };
    loadClients();
  }, []);

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setPrintMode('none');
        setLastFacture(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addItem = useCallback((description: string, prix: number, groupeTva: 'A' | 'B' | 'C' = 'C') => {
    setCart(prev => {
      const existing = prev.items.find(
        i => i.description.toLowerCase() === description.toLowerCase() && i.prix_unitaire === prix
      );
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === existing.id ? { ...i, quantite: i.quantite + 1, montant_total: (i.quantite + 1) * i.prix_unitaire } : i
          ),
        };
      }
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        description,
        prix_unitaire: prix,
        quantite: 1,
        montant_total: prix,
        groupe_tva: groupeTva,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCart(prev => ({
      ...prev,
      items: prev.items
        .map(i => {
          if (i.id !== id) return i;
          const newQty = i.quantite + delta;
          if (newQty <= 0) return null;
          return { ...i, quantite: newQty, montant_total: newQty * i.prix_unitaire };
        })
        .filter(Boolean) as CartItem[],
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const subtotal = cart.items.reduce((sum, i) => sum + i.montant_total, 0);
  const totalTva = cart.items.reduce((sum, i) => {
    const tvaRate = TVA_RATES[i.groupe_tva || 'C'] || 0;
    return sum + i.montant_total * tvaRate;
  }, 0);
  const totalTtc = subtotal + totalTva;
  const change = cart.montant_recu - totalTtc;

  const handleQuickAdd = () => {
    // Parse "nom|prix" or just treat as description
    const parts = searchQuery.split('|').map(s => s.trim());
    if (parts.length === 2 && !isNaN(Number(parts[1]))) {
      addItem(parts[0], Number(parts[1]), 'C');
    } else if (searchQuery.trim()) {
      // Try to parse "description prix" at end
      const match = searchQuery.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*$/);
      if (match) {
        addItem(match[1].trim(), Number(match[2].replace(',', '.')), 'C');
      } else {
        addItem(searchQuery.trim(), 0, 'C');
      }
    }
  };

  const processPayment = async () => {
    if (cart.items.length === 0) {
      showError('Ajoutez au moins un article');
      return;
    }
    if (cart.mode_paiement === 'cash' && cart.montant_recu < totalTtc) {
      showError('Montant reçu insuffisant');
      return;
    }
    if (cart.mode_paiement === 'card' && change < 0) {
      showError('Pour la carte, montant exact requis');
      return;
    }
    if (cart.mode_paiement === 'mobile' && change < 0) {
      showError('Pour Mobile Money, montant exact requis');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // ── COD-76: Fetch open caisse_session before creating facture ──────────
      let openSession: any = null;
      try {
        const { data: session } = await supabase
          .from('caisse_sessions')
          .select('id, total_ventes, total_especes, total_carte, total_mobile')
          .eq('opened_by', user.id)
          .eq('statut', 'ouverte')
          .single();
        openSession = session;
      } catch (sessionErr) {
        console.warn('[COD-76] caisse_session lookup failed:', sessionErr);
      }

      // Generate invoice number
      const year = new Date().getFullYear();
      const { data: countData } = await supabase
        .from('factures')
        .select('id', { count: 'exact', head: true })
        .like('facture_number', `FV-${year}-%`);
      const seqNum = ((countData?.count ?? 0) + 1).toString().padStart(4, '0');
      const factureNumber = `FV-${year}-${seqNum}`;

      // Create facture (with mode_paiement + session_id for COD-76)
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert({
          facture_number: factureNumber,
          type: 'facture',
          statut: 'validee',
          client_id: cart.client?.id || '00000000-0000-0000-0000-000000000000',
          mode_livraison: 'aerien',
          devise: 'USD',
          subtotal: subtotal,
          montant_ht: subtotal,
          montant_tva: 0,
          montant_ttc: subtotal,
          frais: 0,
          total_general: subtotal,
          mode_paiement: cart.mode_paiement,
          session_id: openSession?.id || null,
          date_emission: new Date().toISOString(),
          date_validation: new Date().toISOString(),
          valide_par: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (factureError) throw factureError;

      // ── COD-76: Update open caisse_session totals ──────────────────────────
      if (openSession) {
        try {
          const updateFields: Record<string, number> = {
            total_ventes: (parseFloat(String(openSession.total_ventes)) || 0) + subtotal,
          };
          if (cart.mode_paiement === 'cash') {
            updateFields.total_especes = (parseFloat(String(openSession.total_especes)) || 0) + subtotal;
          } else if (cart.mode_paiement === 'card') {
            updateFields.total_carte = (parseFloat(String(openSession.total_carte)) || 0) + subtotal;
          } else if (cart.mode_paiement === 'mobile') {
            updateFields.total_mobile = (parseFloat(String(openSession.total_mobile || '0')) || 0) + subtotal;
          }
          await supabase
            .from('caisse_sessions')
            .update(updateFields)
            .eq('id', openSession.id);
        } catch (updateErr) {
          console.warn('[COD-76] caisse_session update failed:', updateErr);
        }
      }

      // Create facture items
      const itemsToInsert = cart.items.map((item, idx) => ({
        facture_id: facture.id,
        numero_ligne: idx + 1,
        description: item.description,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        montant_total: item.montant_total,
        poids: 0,
      }));

      const { error: itemsError } = await supabase.from('facture_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Register in DGI invoice registry
      let numeroDgi = '';
      try {
        const [dgNum, codeAuth] = await Promise.all([
          generateNumeroDgi(),
          Promise.resolve(generateCodeAuth()),
        ]);
        numeroDgi = dgNum;
        const qrData = await generateQrCodeData(
          { ...facture, items: cart.items } as any,
          undefined
        );
        await supabase.from('dgi_invoice_registry').insert({
          numero_dgi: dgNum,
          code_auth: codeAuth,
          qr_code_data: qrData,
          facture_id: facture.id,
          date_facture: new Date().toISOString().split('T')[0],
          client_nom: cart.client?.nom || 'Client anonyme',
          total_htva: subtotal,
          taux_tva: 0.16,
          montant_tva: totalTva,
          total_ttc: totalTtc,
          content_hash: `${factureNumber}-${Date.now()}`,
          statut: 'declared',
          created_by: user.id,
        });
        setDgiInfo({ numero_dgi: dgNum, code_auth: codeAuth });
      } catch (dgiErr) {
        console.warn('DGI registration failed:', dgiErr);
      }

      setLastFacture({ number: factureNumber, total: totalTtc });
      setPrintMode('preview');
      showSuccess(`Facture ${factureNumber} créée ✓${numeroDgi ? ` · DGI: ${numeroDgi}` : ''}`);
      
      // Reset cart
      setCart({ client: null, items: [], mode_paiement: 'cash', montant_recu: 0 });
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la création');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const WinPrint = window.open('', '', 'width=300,height=600');
    if (!WinPrint) {
      showError('Autorisez les popups pour imprimer');
      return;
    }
    WinPrint.document.write(`
      <html>
      <head>
        <title>Ticket ${lastFacture?.number}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { font-family: monospace; font-size: 12px; width: 80mm; margin: 0; padding: 5px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; }
          .line { border-top: 1px dashed #000; margin: 3px 0; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${printContent.innerHTML}</body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 250);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Mockup对齐: FactureX logo + POS badge + cashier + clock */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-extrabold">FX</span>
              </div>
              <span className="text-base font-extrabold text-gray-900">Facture<span className="text-emerald-600">Smart</span></span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold ml-1">POS</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 ml-4 pl-4 border-l border-gray-200">
              <span className="font-medium">Caisse #1</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              <span id="pos-clock" className="font-mono font-medium">--:--</span>
            </div>
            <button onClick={() => navigate('/pos/settings')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <span className="text-lg"><i className="ri-settings-3-line" /></span>
            </button>
            <button onClick={() => navigate('/pos/historique')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <span className="text-lg"><i className="ri-file-chart-line" /></span>
            </button>
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <span className="text-lg"><i className="ri-notification-3-line" /></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main: LEFT (products) + RIGHT (cart sidebar) */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Products grid */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Search + Category pills */}
          <div className="p-4 bg-white border-b border-gray-100 flex-shrink-0">
            <div className="flex gap-3 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleQuickAdd();
                    if (e.key === 'Tab') { e.preventDefault(); handleQuickAdd(); }
                  }}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 bg-white h-11"
                />
              </div>
              <Button
                onClick={() => setShowArticlePanel(p => !p)}
                className={`h-11 px-4 rounded-xl text-sm font-bold flex items-center gap-2 ${showArticlePanel ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
              >
                <span className="text-lg"><i className="ri-barcode-line" /></span>
                <span className="hidden sm:inline">Scanner</span>
              </Button>
            </div>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white whitespace-nowrap shadow-sm">Tous</button>
              {['Boissons', 'Snacks', 'Alimentation', 'Produits frais', 'Accessoires'].map(cat => (
                <button key={cat} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 whitespace-nowrap transition-colors">{cat}</button>
              ))}
            </div>
          </div>

          {/* Article Catalog Panel */}
          {showArticlePanel && (
            <div className="border-t bg-gray-50 p-4 max-h-72 overflow-auto flex-shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <Input
                  placeholder="Filtrer articles..."
                  value={articleSearch}
                  onChange={e => setArticleSearch(e.target.value)}
                  className="flex-1 h-9"
                />
                <span className="text-xs text-gray-500">{articles.length} articles</span>
              </div>
              {articlesLoading ? (
                <div className="text-center py-4 text-gray-400 text-sm">Chargement...</div>
              ) : (
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {articles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => addItem(article.denomination, article.prix, article.groupe_tva)}
                      className="flex flex-col items-start p-2 bg-white border border-gray-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-1 mt-1">
                        <span className="text-emerald-600 text-lg"><i className="ri-checkbox-blank-circle-fill" /></span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs leading-tight mb-1">{article.denomination}</span>
                      <span className="text-xs text-gray-500">Stock: {article.stock ?? '∞'}</span>
                      <div className="flex items-center gap-1 w-full mt-1">
                        <span className="font-extrabold text-emerald-600 text-sm">{article.prix.toFixed(2)} $</span>
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Plus className="h-3 w-3 text-white font-bold" />
                        </div>
                      </div>
                    </button>
                  ))}
                  {articles.length === 0 && (
                    <div className="col-span-3 text-center py-4 text-gray-400 text-sm">Aucun article trouvé</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Products Grid - Mockup对齐 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {/* Mockup-style product tiles — sample static products */}
              {[
                { name: 'Café expresso', price: 1.50, stock: 48, color: 'emerald' },
                { name: 'Eau minérale 50cl', price: 0.75, stock: 120, color: 'blue' },
                { name: 'Pain au chocolat', price: 2.00, stock: 25, color: 'orange' },
                { name: 'Chocapic Granola', price: 3.50, stock: 38, color: 'yellow' },
                { name: 'Sac plastique', price: 0.25, stock: 200, color: 'purple' },
                { name: 'Recharge Om 5$', price: 5.00, stock: 999, color: 'red' },
                { name: 'Savon lave-linge', price: 4.75, stock: 55, color: 'cyan' },
                { name: 'Jus naturel 30cl', price: 2.50, stock: 30, color: 'green' },
              ].map((product, idx) => (
                <button
                  key={idx}
                  onClick={() => addItem(product.name, product.price, 'C')}
                  className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center text-center shadow-sm relative overflow-hidden hover:border-emerald-300 hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-${product.color}-500`} />
                  <div className={`w-12 h-12 rounded-xl bg-${product.color}-50 flex items-center justify-center mb-2 mt-1`}>
                    <span className={`text-${product.color}-600 text-2xl`}><i className="ri-checkbox-blank-circle-fill" /></span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 leading-tight mb-1">{product.name}</div>
                  <div className="text-xs text-gray-500 mb-1">Stock: {product.stock}</div>
                  <div className="text-sm font-extrabold text-emerald-600">{product.price.toFixed(2)} $</div>
                  <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white font-bold" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart sidebar - Mockup对齐 screen-G1 */}
        <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg flex-shrink-0">

          {/* Cart header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-700"><i className="ri-shopping-cart-2-line" /></span>
              <span className="font-bold text-gray-900 text-sm">Panier</span>
              {cart.items.length > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cart.items.reduce((s, i) => s + i.quantite, 0)}</span>
              )}
            </div>
            <button
              onClick={() => setCart(prev => ({ ...prev, items: [] }))}
              className="text-xs text-gray-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Vider
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Panier vide</p>
                <p className="text-xs mt-1">Appuyez sur F2 pour chercher</p>
              </div>
            ) : (
              cart.items.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-500 text-base"><i className="ri-checkbox-blank-circle-fill" /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">{item.description}</div>
                    <div className="text-[10px] text-gray-400">{item.prix_unitaire.toFixed(2)} $ / unité</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                      <span className="text-xs font-bold"><Minus className="h-3 w-3" /></span>
                    </button>
                    <span className="text-sm font-bold text-gray-900 w-4 text-center">{item.quantite}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <span className="text-xs font-bold"><Plus className="h-3 w-3" /></span>
                    </button>
                  </div>
                  <div className="text-xs font-extrabold text-gray-900 font-mono w-12 text-right">{item.montant_total.toFixed(2)} $</div>
                </div>
              ))
            )}
          </div>

          {/* Totals + Pay button */}
          <div className="border-t border-gray-200 p-4 space-y-3 bg-white">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>HT ({cart.items.reduce((s, i) => s + i.quantite, 0)} articles)</span>
                <span className="font-mono">{subtotal.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>TVA 18%</span>
                <span className="font-mono">{totalTva.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Total TTC</span>
                <span className="font-mono text-emerald-600">{totalTtc.toFixed(2)} $</span>
              </div>
            </div>

            {/* Pay button — ouvre le checkout modal */}
            <Button
              onClick={() => setShowCheckout(true)}
              disabled={cart.items.length === 0 || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Traitement...</span>
              ) : (
                <>
                  <span className="text-xl"><i className="ri-wallet-line" /></span>
                  Payer — {totalTtc.toFixed(2)} $
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50"
              >
                <span className="text-sm"><i className="ri-file-list-3-line" /></span>
                Catalogue
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50"
              >
                <span className="text-sm"><i className="ri-save-line" /></span>
                Sauvegarder
              </Button>
            </div>

            {/* Client + Montant reçu (cash mode) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Client</span>
                {cart.client ? (
                  <span className="text-xs font-medium text-gray-900">{cart.client.nom}</span>
                ) : (
                  <ClientCombobox
                    clients={clients}
                    value={cart.client?.id || ''}
                    onValueChange={(clientId) => {
                      const selected = clients.find(c => c.id === clientId) || null;
                      setCart(prev => ({ ...prev, client: selected }));
                    }}
                  />
                )}
              </div>
              {cart.mode_paiement === 'cash' && (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Reçu</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={cart.montant_recu || ''}
                        onChange={e => setCart(prev => ({ ...prev, montant_recu: Number(e.target.value) }))}
                        className="h-9 text-sm font-medium"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Rendu</label>
                      <div className={`h-9 flex items-center px-3 border rounded-lg text-sm font-bold ${change >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                        {change >= 0 ? change.toFixed(2) + ' $' : 'Insuffisant'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Payment mode selector */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {([
                  { key: 'cash', label: 'Espèces', icon: 'ri-money-dollar-circle-line' },
                  { key: 'card', label: 'Carte', icon: 'ri-bank-card-line' },
                  { key: 'mobile', label: 'Mobile', icon: 'ri-smartphone-line' },
                ] as const).map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => setCart(prev => ({ ...prev, mode_paiement: mode.key, montant_recu: mode.key !== 'cash' ? totalTtc : prev.montant_recu }))}
                    className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors ${cart.mode_paiement === mode.key ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <span className="text-base"><i className={mode.icon} /></span>
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal — COD-63: multi-modes + split payment + billetage */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">

            {/* Checkout Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <span className="text-white text-xs font-extrabold">FX</span>
                  </div>
                  <span className="text-base font-extrabold text-gray-900">Facture<span className="text-emerald-600">Smart</span></span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Paiement</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 font-mono">--:--</div>
            </div>

            {/* Checkout Body: LEFT (cart summary) + RIGHT (payment) */}
            <div className="flex flex-1 overflow-hidden">

              {/* LEFT: Cart summary */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-gray-700" />
                      <span className="font-bold text-gray-900 text-sm">Récapitulatif du panier</span>
                    </div>
                    <span className="text-xs text-gray-400">{cart.items.reduce((s, i) => s + i.quantite, 0)} articles</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {cart.items.map(item => (
                      <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-500 text-sm"><i className="ri-checkbox-blank-circle-fill" /></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{item.description}</div>
                          <div className="text-[10px] text-gray-400">{item.quantite} × {item.prix_unitaire.toFixed(2)} $</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 font-mono">{item.montant_total.toFixed(2)} $</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>HT ({cart.items.reduce((s, i) => s + i.quantite, 0)} articles)</span>
                      <span className="font-mono">{subtotal.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>TVA 18%</span>
                      <span className="font-mono">{totalTva.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t border-gray-200 pt-2">
                      <span>Total TTC</span>
                      <span className="font-mono text-emerald-600">{totalTtc.toFixed(2)} $</span>
                    </div>
                  </div>
                </div>

                {/* Amount received */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Montant reçu (USD)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={cart.montant_recu || ''}
                      onChange={e => setCart(prev => ({ ...prev, montant_recu: Number(e.target.value) }))}
                      className="w-full pl-4 pr-10 py-3.5 rounded-xl border-2 border-emerald-200 text-2xl font-extrabold text-gray-900 focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">$</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold mt-3 p-3 rounded-xl ${change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span>{change >= 0 ? 'Monnaie à rendre' : 'Montant insuffisant'}</span>
                    <span className="font-mono">{change >= 0 ? change.toFixed(2) + ' $' : Math.abs(change).toFixed(2) + ' $ manquant'}</span>
                  </div>
                  {/* Billetage automatique */}
                  {change > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs font-bold text-gray-700 mb-2">Répartition rendue</div>
                      <div className="space-y-1">
                        {(() => {
                          const bills = [20, 10, 5, 1, 0.5, 0.2, 0.1, 0.05];
                          const labels = ['Billets 20$', 'Billets 10$', 'Billets 5$', 'Billets 1$', 'Pièces 0.50$', 'Pièces 0.20$', 'Pièces 0.10$', 'Pièces 0.05$'];
                          let remaining = change;
                          return bills.map((bill, idx) => {
                            const count = Math.floor(remaining / bill);
                            remaining = Math.round((remaining - count * bill) * 100) / 100;
                            return count > 0 ? (
                              <div key={bill} className="flex justify-between text-xs text-gray-600">
                                <span>{labels[idx]}</span>
                                <span className="font-semibold">× {count}</span>
                              </div>
                            ) : null;
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Payment method selection */}
              <div className="w-96 p-6 overflow-y-auto bg-gray-50">

                {/* Payment methods */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <div className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-emerald-500 text-lg"><i className="ri-wallet-3-line" /></span>
                    Moyen de paiement
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'cash', label: 'Espèces', sub: 'USD', icon: 'ri-money-dollar-circle-line', color: 'green' },
                      { key: 'mpesa', label: 'M-Pesa', sub: 'Vodacom', icon: 'ri-water-percent-line', color: 'orange' },
                      { key: 'airtel', label: 'Airtel Money', sub: 'Airtel', icon: 'ri-smartphone-line', color: 'red' },
                      { key: 'card', label: 'Carte', sub: 'Visa/MC', icon: 'ri-bank-card-line', color: 'blue' },
                    ] as const).map(method => (
                      <button
                        key={method.key}
                        onClick={() => setCart(prev => ({ ...prev, mode_paiement: method.key as 'cash' | 'card' | 'mobile', montant_recu: method.key !== 'cash' ? totalTtc : prev.montant_recu }))}
                        className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${cart.mode_paiement === method.key ? `border-emerald-500 bg-emerald-50` : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                      >
                        <div className={`check-badge absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 items-center justify-center ${cart.mode_paiement === method.key ? 'flex' : 'hidden'}`}>
                          <Check className="h-3 w-3 text-white font-bold" />
                        </div>
                        <div className={`w-10 h-10 rounded-xl bg-${method.color}-50 flex items-center justify-center mb-2`}>
                          <span className={`text-${method.color}-600 text-xl`}><i className={method.icon} /></span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{method.label}</div>
                        <div className="text-[10px] text-gray-400">{method.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split payment */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-emerald-500 text-lg"><i className="ri-pie-chart-2-line" /></span>
                    Split payment
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Division du paiement entre plusieurs modes</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 w-20">Espèces</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="flex-1 h-8 text-xs font-mono"
                        value={cart.mode_paiement === 'cash' ? (cart.montant_recu > 0 ? Math.min(cart.montant_recu, totalTtc).toFixed(2) : '') : ''}
                        onChange={e => {
                          if (cart.mode_paiement === 'cash') {
                            const v = Number(e.target.value);
                            setCart(prev => ({ ...prev, montant_recu: v }));
                          }
                        }}
                      />
                      <span className="text-xs text-gray-400">$</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 w-20">Mobile</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="flex-1 h-8 text-xs font-mono"
                        onChange={e => {
                          // Split payment tracking (simplifié — somme vérifiée côté serveur)
                        }}
                      />
                      <span className="text-xs text-gray-400">$</span>
                    </div>
                  </div>
                </div>

                {/* Client info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" />
                    Client
                  </div>
                  {cart.client ? (
                    <div className="text-sm text-gray-900 font-medium">{cart.client.nom}</div>
                  ) : (
                    <ClientCombobox
                      clients={clients}
                      value={cart.client?.id || ''}
                      onValueChange={(clientId) => {
                        const selected = clients.find(c => c.id === clientId) || null;
                        setCart(prev => ({ ...prev, client: selected }));
                      }}
                    />
                  )}
                </div>

                {/* Confirm payment */}
                <Button
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      await processPayment();
                      setShowCheckout(false);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={cart.items.length === 0 || isProcessing || (cart.mode_paiement === 'cash' && change < 0)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Traitement...</span>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Confirmer — {totalTtc.toFixed(2)} $
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowCheckout(false)}
                  className="w-full mt-2 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal on success */}
      {printMode === 'preview' && lastFacture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-500" /> Paiement réussi
              </h3>
              <button onClick={() => { setPrintMode('none'); setLastFacture(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-2">Facture <strong>{lastFacture.number}</strong></p>
            <p className="text-2xl font-bold text-emerald-600 mb-4">{lastFacture.total.toFixed(2)} $</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-emerald-800 text-sm font-medium flex items-center gap-2">
                <Check className="h-4 w-4" /> Transaction enregistrée
              </p>
            </div>
            <Button onClick={() => { printReceipt(); setPrintMode('none'); setLastFacture(null); }} className="w-full bg-gray-800 hover:bg-gray-900">
              <Printer className="h-4 w-4 mr-2" /> Imprimer Ticket
            </Button>
          </div>
        </div>
      )}

      {/* Hidden receipt for printing */}
      <div className="hidden"><div ref={receiptRef} /></div>
    </div>
  );
}

function ReceiptContent({ factureNumber, items, subtotal, change, client }: {
  factureNumber: string;
  items: CartItem[];
  subtotal: number;
  change: number;
  client: Client | null;
}) {
  const totalTtc = subtotal + items.reduce((sum, i) => {
    const tvaRate = TVA_RATES[i.groupe_tva || 'C'] || 0;
    return sum + i.montant_total * tvaRate;
  }, 0);
  const now = new Date();
  const modePaiement = 'Espèces (USD)';

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        width: '72mm',
        background: '#fff',
        padding: '8px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '1px dashed #ccc', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '8px', fontWeight: 'bold' }}>FX</span>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>FactureSmart</span>
        </div>
        <div style={{ fontSize: '9px', fontWeight: '600', color: '#334155' }}>Ma Boutique SARL</div>
        <div style={{ fontSize: '8px', color: '#94a3b8' }}>Avenue du Commerce, Kinshasa</div>
        <div style={{ fontSize: '8px', color: '#94a3b8' }}>NIF: 0123456789 | RCCM: CD/KIN/2024/12345</div>
      </div>

      {/* Ticket info */}
      <div style={{ paddingBottom: '5px', borderBottom: '1px dashed #e2e8f0', marginBottom: '5px' }}>
        {[
          ['Ticket N°', factureNumber || '#0000'],
          ['Date', now.toLocaleDateString('fr-FR')],
          ['Heure', now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })],
          ['Caissier(e)', 'Marie K.'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginBottom: '1px' }}>
            <span>{label}</span>
            <span style={{ fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{val}</span>
          </div>
        ))}
        {client && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
            <span>Client</span>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>{client.nom}</span>
          </div>
        )}
      </div>

      {/* Items header */}
      <div style={{ paddingBottom: '3px', borderBottom: '1px dashed #e2e8f0', marginBottom: '3px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 50px', fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Article</span>
          <span style={{ textAlign: 'center' }}>Qté</span>
          <span style={{ textAlign: 'right' }}>Montant</span>
        </div>
      </div>

      {/* Items */}
      <div style={{ paddingBottom: '5px', borderBottom: '1px dashed #e2e8f0', marginBottom: '5px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 30px 50px', fontSize: '10px', marginBottom: '2px' }}>
            <span style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>
            <span style={{ textAlign: 'center', color: '#64748b' }}>{item.quantite}</span>
            <span style={{ textAlign: 'right', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace' }}>{item.montant_total.toFixed(2)} $</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ paddingBottom: '5px', borderBottom: '1px dashed #e2e8f0', marginBottom: '5px' }}>
        {[
          ['HT', subtotal.toFixed(2) + ' $'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginBottom: '1px' }}>
            <span>{label}</span>
            <span style={{ fontFamily: 'monospace' }}>{val}</span>
          </div>
        ))}
        {[
          ['TVA 18%', (totalTtc - subtotal).toFixed(2) + ' $'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginBottom: '1px' }}>
            <span>{label}</span>
            <span style={{ fontFamily: 'monospace' }}>{val}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', borderTop: '1px dashed #e2e8f0', paddingTop: '3px', marginTop: '2px' }}>
          <span>TTC</span>
          <span style={{ fontFamily: 'monospace', color: '#10b981' }}>{totalTtc.toFixed(2)} $</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', paddingTop: '2px' }}>
          <span>Espèces reçu</span>
          <span style={{ fontFamily: 'monospace' }}>{(change + totalTtc).toFixed(2)} $</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', color: '#15803d', background: '#f0fdf4', padding: '2px 4px', borderRadius: '3px', marginTop: '2px' }}>
          <span>Monnaie rendue</span>
          <span style={{ fontFamily: 'monospace' }}>{change.toFixed(2)} $</span>
        </div>
      </div>

      {/* Payment */}
      <div style={{ paddingBottom: '5px', borderBottom: '1px dashed #e2e8f0', marginBottom: '5px', fontSize: '9px', color: '#64748b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Paiement</span>
          <span style={{ fontWeight: '600', color: '#0f172a' }}>{modePaiement}</span>
        </div>
      </div>

      {/* DGI Code */}
      <div style={{ paddingBottom: '6px', borderBottom: '1px dashed #e2e8f0', marginBottom: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '8px', color: '#94a3b8', marginBottom: '4px' }}>Code DGI</div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
          {factureNumber ? `DGI-${factureNumber}` : 'DGI-000000'}
        </div>
        {/* QR placeholder */}
        <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '4px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px' }}>
            {['#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a','#fff','#1a1a1a'].map((bg, i) => (
              <div key={i} style={{ background: bg, borderRadius: '1px' }} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: '7px', color: '#94a3b8', marginTop: '2px' }}>Scannez pour vérifier</div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingBottom: '4px' }}>
        <div style={{ fontSize: '10px', fontWeight: '600', color: '#334155', marginBottom: '2px' }}>Merci — À bientôt !</div>
        <div style={{ fontSize: '8px', color: '#94a3b8', lineHeight: '1.4' }}>
          Article non échangeable sans ticket.<br />
          Conforme DGI — RDC
        </div>
        {/* DRC flag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '4px' }}>
          <div style={{ display: 'flex', width: '16px', height: '10px', overflow: 'hidden', borderRadius: '2px' }}>
            <div style={{ width: '33.33%', background: '#0073e6' }} />
            <div style={{ width: '33.33%', background: '#ffd100' }} />
            <div style={{ width: '33.33%', background: '#ea2839' }} />
          </div>
          <span style={{ fontSize: '7px', color: '#94a3b8' }}>République Démocratique du Congo</span>
        </div>
      </div>
    </div>
  );
}
