"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  Building2,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  DollarSign,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
  Hash,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface CompanySettings {
  id: string;
  name: string;
  nif: string;
  regime_imposition: string;
  adresse_fiscale: string;
  telephone_fiscal: string;
  email_fiscal: string;
  rc_number: string;
  idnat_number: string;
  devise_defaut: string;
  timezone: string;
  logo_url: string;
}

const CURRENCIES = ['USD', 'CDF', 'EUR', 'GBP', 'XAF', 'XOF'];
const TIMEZONES = ['Africa/Lubumbashi', 'Africa/Kinshasa', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'UTC'];
const REGIMES = [
  { value: 'reel', label: 'Régime Réel' },
  { value: 'simplifie', label: 'Régime Simplifié' },
  { value: 'forfait', label: 'Régime Forfait / Synthétique' },
];

export default function CompanySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanySettings>({
    id: '',
    name: '',
    nif: '',
    regime_imposition: '',
    adresse_fiscale: '',
    telephone_fiscal: '',
    email_fiscal: '',
    rc_number: '',
    idnat_number: '',
    devise_defaut: 'USD',
    timezone: 'Africa/Lubumbashi',
    logo_url: '',
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Non connecté');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.company_id) throw new Error('Aucune entreprise trouvée');

      const { data: companyData, error: companyErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (companyErr) throw companyErr;

      setCompany({
        id: companyData.id,
        name: companyData.name || '',
        nif: companyData.nif || '',
        regime_imposition: companyData.regime_imposition || '',
        adresse_fiscale: companyData.adresse_fiscale || companyData.address || '',
        telephone_fiscal: companyData.telephone_fiscal || companyData.phone || '',
        email_fiscal: companyData.email_fiscal || companyData.email || '',
        rc_number: companyData.rc_number || '',
        idnat_number: companyData.idnat_number || '',
        devise_defaut: companyData.devise_defaut || 'USD',
        timezone: companyData.timezone || 'Africa/Lubumbashi',
        logo_url: companyData.logo_url || '',
      });
    } catch (err: any) {
      console.error('Error fetching company:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateErr } = await supabase
        .from('companies')
        .update({
          nif: company.nif,
          regime_imposition: company.regime_imposition || null,
          adresse_fiscale: company.adresse_fiscale,
          telephone_fiscal: company.telephone_fiscal,
          email_fiscal: company.email_fiscal,
          rc_number: company.rc_number,
          idnat_number: company.idnat_number,
          devise_defaut: company.devise_defaut,
          timezone: company.timezone,
        })
        .eq('id', company.id);

      if (updateErr) throw updateErr;

      toast({
        title: '✅ Paramètres enregistrés',
        description: 'Les informations de votre entreprise ont été mises à jour.',
      });
    } catch (err: any) {
      console.error('Error saving company:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${company.id}_${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      setCompany(prev => ({ ...prev, logo_url: publicUrl }));

      await supabase.from('companies').update({ logo_url: publicUrl }).eq('id', company.id);

      toast({
        title: '✅ Logo téléchargé',
        description: 'Le logo a été mis à jour.',
      });
    } catch (err: any) {
      console.error('Logo upload error:', err);
      toast({
        variant: 'destructive',
        title: '❌ Erreur',
        description: err.message || 'Erreur lors du téléchargement du logo',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
            Logo et Identité
          </CardTitle>
          <CardDescription>
            Logo de votre entreprise apparaissant sur les factures et documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {company.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <Label htmlFor="logo" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger un logo
                  </span>
                </Button>
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG ou SVG. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
            Informations Fiscales et Légales
          </CardTitle>
          <CardDescription>
            Ces informations sont utilisées pour les déclarations fiscales DGI et les documents légaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'entreprise</Label>
              <Input
                id="name"
                value={company.name}
                onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                placeholder="SARL Coccinelle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nif" className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                NIF (Numéro d'Identification Fiscale)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nif"
                value={company.nif}
                onChange={(e) => setCompany(prev => ({ ...prev, nif: e.target.value }))}
                placeholder="123456789012345"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Obligatoire pour les déclarations DGI
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rc_number" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Numéro RCCM
              </Label>
              <Input
                id="rc_number"
                value={company.rc_number}
                onChange={(e) => setCompany(prev => ({ ...prev, rc_number: e.target.value }))}
                placeholder="RCCM/CD/KIN/2024/12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idnat_number" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                ID.Nat.
              </Label>
              <Input
                id="idnat_number"
                value={company.idnat_number}
                onChange={(e) => setCompany(prev => ({ ...prev, idnat_number: e.target.value }))}
                placeholder="01-1234-56789"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regime" className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Régime d'imposition
              </Label>
              <Select
                value={company.regime_imposition}
                onValueChange={(v) => setCompany(prev => ({ ...prev, regime_imposition: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un régime" />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="devise" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Devise par défaut
              </Label>
              <Select
                value={company.devise_defaut}
                onValueChange={(v) => setCompany(prev => ({ ...prev, devise_defaut: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Fuseau horaire
              </Label>
              <Select
                value={company.timezone}
                onValueChange={(v) => setCompany(prev => ({ ...prev, timezone: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Adresse fiscale
              </Label>
              <Textarea
                id="adresse"
                value={company.adresse_fiscale}
                onChange={(e) => setCompany(prev => ({ ...prev, adresse_fiscale: e.target.value }))}
                placeholder="Avenue du Commerce, Kinshasa, RDC"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Téléphone fiscal
              </Label>
              <Input
                id="telephone"
                value={company.telephone_fiscal}
                onChange={(e) => setCompany(prev => ({ ...prev, telephone_fiscal: e.target.value }))}
                placeholder="+243 81 234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_fiscal" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email fiscal
              </Label>
              <Input
                id="email_fiscal"
                type="email"
                value={company.email_fiscal}
                onChange={(e) => setCompany(prev => ({ ...prev, email_fiscal: e.target.value }))}
                placeholder="fiscal@entreprise.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
}
