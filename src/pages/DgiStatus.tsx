"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Info,
  Search,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { dgiService } from '@/services/dgi';
import { formatCurrency } from '@/utils/formatCurrency';
import { showSuccess, showError } from '@/utils/toast';

type DgiStatus = 'pending' | 'submitted' | 'validated' | 'rejected';

interface DgiTransmission {
  id: string;
  invoice_id: string;
  dgi_reference: string | null;
  status: DgiStatus;
  submitted_at: string | null;
  validated_at: string | null;
  error_message: string | null;
  facture?: {
    facture_number: string;
    total_general: number;
    date_emission: string;
    clients?: { nom: string };
  };
}

const DgiStatusBadge: React.FC<{ status: DgiStatus }> = ({ status }) => {
  const config: Record<DgiStatus, { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    submitted: { label: 'Soumise', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    validated: { label: 'Validee', className: 'bg-green-100 text-green-800 border-green-300' },
    rejected: { label: 'Rejetee', className: 'bg-red-100 text-red-800 border-red-300' },
  };
  const { label, className } = config[status];
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

const DgiStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [transmissions, setTransmissions] = useState<DgiTransmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransmission, setSelectedTransmission] = useState<DgiTransmission | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DgiStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, submitted: 0, validated: 0, rejected: 0 });

  usePageSetup({
    title: 'Statut DGI',
    subtitle: 'Suivi des transmissions a la Direction Generale des Impots',
  });

  const fetchTransmissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dgi_transmissions')
        .select(`
          id, invoice_id, dgi_reference, status, submitted_at, validated_at, error_message,
          factures(facture_number, total_general, date_emission, clients(nom))
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((t: any) => ({
        ...t,
        facture: Array.isArray(t.factures) ? t.factures[0] : t.factures,
      }));

      setTransmissions(mapped);
      setStats({
        total: mapped.length,
        submitted: mapped.filter((t: DgiTransmission) => t.status === 'submitted').length,
        validated: mapped.filter((t: DgiTransmission) => t.status === 'validated').length,
        rejected: mapped.filter((t: DgiTransmission) => t.status === 'rejected').length,
      });
    } catch (err: any) {
      showError('Erreur lors du chargement des transmissions DGI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransmissions(); }, [statusFilter]);

  const handleRefreshStatus = async (transmission: DgiTransmission) => {
    if (!transmission.dgi_reference) {
      showError('Reference DGI non disponible');
      return;
    }
    try {
      const result = await dgiService.getTransmissionStatus(transmission.dgi_reference);
      if (result.status !== transmission.status) {
        await supabase
          .from('dgi_transmissions')
          .update({
            status: result.status,
            validated_at: result.status === 'accepted' ? new Date().toISOString() : null,
          })
          .eq('id', transmission.id);
        showSuccess(`Statut DGI mis a jour: ${result.status}`);
        fetchTransmissions();
      } else {
        showSuccess('Le statut est deja a jour');
      }
    } catch {
      showError('Erreur lors de la verification du statut');
    }
  };

  const openDetail = (transmission: DgiTransmission) => {
    setSelectedTransmission(transmission);
    setDetailOpen(true);
  };

  const filteredTransmissions = transmissions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.dgi_reference?.toLowerCase().includes(q) ||
      t.facture?.facture_number?.toLowerCase().includes(q) ||
      t.facture?.clients?.nom?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transmission DGI</h1>
            <p className="text-sm text-gray-500 mt-1">
              Suivi des factures soumises a la Direction Generale des Impots
            </p>
          </div>
          <Button onClick={fetchTransmissions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total transmissions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Receipt className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Soumises</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Validees</p>
                  <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Rejetees</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numero, reference DGI, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'submitted', 'validated', 'rejected'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {s === 'all' ? 'Tous' : s === 'pending' ? 'En attente' : s === 'submitted' ? 'Soumises' : s === 'validated' ? 'Validees' : 'Rejetees'}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : filteredTransmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Info className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-lg font-medium">Aucune transmission DGI</p>
                <p className="text-sm mt-1">Les transmissions apparaitront ici apres soumission des factures</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Date emission</TableHead>
                    <TableHead>Reference DGI</TableHead>
                    <TableHead>Statut DGI</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransmissions.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(t)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          {t.facture?.facture_number || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{t.facture?.clients?.nom || '—'}</TableCell>
                      <TableCell className="text-right">
                        {t.facture?.total_general ? formatCurrency(t.facture.total_general, 'USD') : '—'}
                      </TableCell>
                      <TableCell>{t.facture?.date_emission || '—'}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {t.dgi_reference || '—'}
                        </code>
                      </TableCell>
                      <TableCell><DgiStatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRefreshStatus(t); }} title="Verifier statut">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(t); }} title="Details">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details transmission DGI</DialogTitle>
            <DialogDescription>Reference: {selectedTransmission?.dgi_reference || '—'}</DialogDescription>
          </DialogHeader>
          {selectedTransmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">N Facture</p>
                  <p className="font-medium">{selectedTransmission.facture?.facture_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Montant</p>
                  <p className="font-medium">
                    {selectedTransmission.facture?.total_general ? formatCurrency(selectedTransmission.facture.total_general, 'USD') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Statut DGI</p>
                  <DgiStatusBadge status={selectedTransmission.status} />
                </div>
                <div>
                  <p className="text-gray-500">Soumise le</p>
                  <p className="font-medium">
                    {selectedTransmission.submitted_at ? new Date(selectedTransmission.submitted_at).toLocaleString('fr-FR') : '—'}
                  </p>
                </div>
              </div>
              {selectedTransmission.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {selectedTransmission.error_message}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => { setDetailOpen(false); navigate('/factures'); }}>
                  Voir facture
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DgiStatusPage;
