"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

export default function POSSettings() {
  const navigate = useNavigate();

  // Printer settings
  const [printerConnected, setPrinterConnected] = useState(true);
  const [printerName, setPrinterName] = useState('Thermal Printer XP-58');
  const [printerStatus, setPrinterStatus] = useState('Prête');
  const [ticketWidth, setTicketWidth] = useState<'58mm' | '80mm'>('58mm');

  // Default settings
  const [defaultTva, setDefaultTva] = useState('18');
  const [defaultCurrency, setDefaultCurrency] = useState('CDF');
  const [offlineMode, setOfflineMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Load settings from DB on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('pos_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        if (data) {
          setTicketWidth(data.ticket_width || '58mm');
          setDefaultTva(data.default_tva || '18');
          setDefaultCurrency(data.default_currency || 'CDF');
          setOfflineMode(data.offline_mode || false);
          if (data.printer_name) setPrinterName(data.printer_name);
        }
      } catch (err) {
        // Table might not exist yet — use defaults
        console.warn('POS settings table not available, using defaults');
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('pos_settings')
        .upsert({
          id: 'default',
          ticket_width: ticketWidth,
          default_tva: defaultTva,
          default_currency: defaultCurrency,
          offline_mode: offlineMode,
          printer_name: printerName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      showSuccess('Paramètres POS enregistrés ✓');
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-base"><i className="ri-file-paper-2-line" /></span>
              </div>
              <span className="text-gray-900 text-base font-bold">Facture Smart</span>
            </div>
          </div>
          <div className="flex-1 px-4 py-4 space-y-1">
            <div className="px-3 py-2 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paramètres</span>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg text-gray-500"><i className="ri-settings-3-line" /></span>
              Général
            </button>
            <button
              onClick={() => navigate('/pos/settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-green-50 rounded-xl text-sm font-semibold text-green-700 border-l-[3px] border-green-600"
            >
              <span className="text-lg"><i className="ri-printer-line" /></span>
              POS
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 ml-0">
          <header className="bg-white border-b border-gray-200 px-8 py-4">
            <h1 className="text-xl font-bold text-gray-900">Paramètres Point de Vente</h1>
            <p className="text-sm text-gray-500">Configurez votre terminal de vente</p>
          </header>

          <main className="p-8 max-w-2xl">
            {/* Printer section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Imprimante ticket</h3>
              <div className="space-y-4">
                {/* Printer status card */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 text-lg"><i className="ri-printer-line" /></span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{printerName}</p>
                      <p className="text-xs text-gray-400">USB — {printerConnected ? 'Connectée' : 'Déconnectée'}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {printerStatus}
                  </span>
                </div>

                {/* Ticket width */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Largeur ticket</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTicketWidth('58mm')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        ticketWidth === '58mm'
                          ? 'border-2 border-green-300 bg-green-50 text-green-700'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      58mm
                    </button>
                    <button
                      onClick={() => setTicketWidth('80mm')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        ticketWidth === '80mm'
                          ? 'border-2 border-green-300 bg-green-50 text-green-700'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      80mm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Default settings section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Paramètres par défaut</h3>
              <div className="space-y-4">
                {/* TVA */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">TVA par défaut</label>
                  <select
                    value={defaultTva}
                    onChange={e => setDefaultTva(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100"
                  >
                    <option value="18">18% — Standard</option>
                    <option value="0">0% — Exonéré</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Devise</label>
                  <select
                    value={defaultCurrency}
                    onChange={e => setDefaultCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100"
                  >
                    <option value="CDF">CDF — Francs Congolais</option>
                    <option value="USD">USD — Dollars US</option>
                  </select>
                </div>

                {/* Offline mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Mode hors ligne</p>
                    <p className="text-xs text-gray-400">Continuer à vendre sans connexion</p>
                  </div>
                  <button
                    onClick={() => setOfflineMode(!offlineMode)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      offlineMode ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-transform ${
                        offlineMode ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </main>
        </div>
      </div>
    </Layout>
  );
}
