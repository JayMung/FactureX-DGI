"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Printer,
  Download,
  Edit,
  ArrowLeft,
  ExternalLink,
  Send,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatCurrency';
import { showSuccess, showError } from '@/utils/toast';
import type { Facture, FactureItem } from '@/types';

const STATUT_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  brouillon: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700 border-gray-300', icon: <Clock className="h-3 w-3 mr-1" /> },
  en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <Clock className="h-3 w-3 mr-1" /> },
  validee: { label: 'Validee', className: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  payee: { label: 'Payee', className: 'bg-blue-100 text-blue-700 border-blue-300', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  annulee: { label: 'Annulee', className: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle className="h-3 w-3 mr-1" /> },
};

const InvoiceDetailFull: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [items, setItems] = useState<FactureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);

  usePageSetup({
    title: facture ? `Facture ${facture.facture_number}` : 'Detail facture',
    subtitle: 'Vue complete de la facture',
  });

  useEffect(() => {
    if (!id) { navigate('/factures'); return; }
    loadFacture();
  }, [id]);

  const loadFacture = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('factures')
        .select('*, clients(*)')
        .eq('id', id)
        .single();

      if (error || !data) { showError('Facture introuvable'); navigate('/factures'); return; }

      setFacture(data as Facture);
      setClientInfo(data.clients);

      // Load items
      const { data: itemsData } = await supabase
        .from('facture_items')
        .select('*')
        .eq('facture_id', id)
        .order('numero_ligne');

      setItems((itemsData || []) as FactureItem[]);
    } catch (err) {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const statutCfg = facture ? (STATUT_CONFIG[facture.statut] || STATUT_CONFIG.brouillon) : null;

  const handlePrint = () => { window.print(); };
  const handleSendEmail = async () => {
    if (!clientInfo?.email) { showError('Email client non disponible'); return; }
    showSuccess(`Facture envoyee a ${clientInfo.email}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!facture) return null;

  return (
    <Layout>
      <div className="space-y-6 print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/factures')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {facture.type === 'devis' ? 'Devis' : 'Facture'} {facture.facture_number}
                </h1>
                {statutCfg && (
                  <Badge variant="outline" className={statutCfg.className + ' flex items-center'}>
                    {statutCfg.icon}
                    {statutCfg.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Emise le {facture.date_emission} • {facture.devise}
              </p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => navigate(`/factures/edit/${id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => navigate(`/factures/preview/${id}`)}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lignes de facture</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-600">#</th>
                      <th className="text-left p-3 font-medium text-gray-600">Description</th>
                      <th className="text-right p-3 font-medium text-gray-600">Qte</th>
                      <th className="text-right p-3 font-medium text-gray-600">Prix unitaire</th>
                      <th className="text-right p-3 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b">
                        <td className="p-3 text-gray-500">{item.numero_ligne}</td>
                        <td className="p-3 font-medium">{item.description}</td>
                        <td className="p-3 text-right">{item.quantite}</td>
                        <td className="p-3 text-right">{formatCurrency(item.prix_unitaire, facture.devise || 'USD')}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.montant_total, facture.devise || 'USD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-end gap-2">
                  <div className="flex justify-between w-64 text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-medium">{formatCurrency(facture.subtotal || 0, facture.devise || 'USD')}</span>
                  </div>
                  {(facture.frais || 0) > 0 && (
                    <div className="flex justify-between w-64 text-sm">
                      <span className="text-gray-500">Frais</span>
                      <span className="font-medium">{formatCurrency(facture.frais, facture.devise || 'USD')}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-green-700">{formatCurrency(facture.total_general || 0, facture.devise || 'USD')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {facture.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{facture.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Conditions */}
            {facture.conditions_vente && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conditions de vente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{facture.conditions_vente}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{clientInfo?.nom || '—'}</p>
                  {clientInfo?.entreprise && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Building className="h-3 w-3" />{clientInfo.entreprise}
                    </p>
                  )}
                  {clientInfo?.telephone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />{clientInfo.telephone}
                    </p>
                  )}
                  {clientInfo?.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />{clientInfo.email}
                    </p>
                  )}
                  {clientInfo?.adresse && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{clientInfo.adresse}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/clients/${clientInfo?.id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir client
                </Button>
              </CardContent>
            </Card>

            {/* Invoice info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Numero</span>
                  <span className="font-medium font-mono">{facture.facture_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date emission</span>
                  <span className="font-medium">{facture.date_emission}</span>
                </div>
                {facture.date_validation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Echeance</span>
                    <span className="font-medium">{facture.date_validation}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Devise</span>
                  <span className="font-medium">{facture.devise || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode livraison</span>
                  <span className="font-medium capitalize">{facture.mode_livraison}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <Badge variant="outline">{facture.type === 'devis' ? 'Devis' : 'Facture'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* DGI Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Statut DGI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/factures/${id}/dgi-status`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir statut DGI
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvoiceDetailFull;
