"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { usePageSetup } from '../hooks/use-page-setup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, User, Phone, MapPin, Building2, FileText, Mail, StickyNote } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { showSuccess, showError } from '@/utils/toast';
import { capitalizeWords } from '@/utils/textFormat';
import {
  sanitizeUserContent,
  validateContentSecurity,
  sanitizeClientName,
  sanitizePhoneNumber,
  sanitizeCityName
} from '@/lib/security/content-sanitization';

const ClientsNew: React.FC = () => {
  usePageSetup({
    title: 'Nouveau Client',
    subtitle: 'Créez un nouveau client'
  });

  const navigate = useNavigate();
  const { createClient, isCreating } = useClients();

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    ville: '',
    adresse: '',
    nif: '',
    notes: '',
    type: 'particulier' as 'particulier' | 'entreprise'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else {
      const nameValidation = validateContentSecurity(formData.nom);
      if (!nameValidation.isValid) {
        newErrors.nom = 'Le nom contient des caractères non autorisés';
      }
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^[+]?[\d\s\-()]{10,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    } else {
      const phoneValidation = validateContentSecurity(formData.telephone);
      if (!phoneValidation.isValid) {
        newErrors.telephone = 'Le téléphone contient des caractères non autorisés';
      }
    }

    if (!formData.ville.trim()) {
      newErrors.ville = 'La ville est requise';
    } else {
      const cityValidation = validateContentSecurity(formData.ville);
      if (!cityValidation.isValid) {
        newErrors.ville = 'La ville contient des caractères non autorisés';
      }
    }

    if (formData.nif && formData.nif.trim()) {
      const nifClean = formData.nif.replace(/[-\s]/g, '');
      if (!/^\d{6,15}$/.test(nifClean)) {
        newErrors.nif = 'Format NIF invalide (ex: 123456789012)';
      }
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Format email invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const dataToSave = {
        nom: sanitizeClientName(capitalizeWords(formData.nom.trim())),
        telephone: sanitizePhoneNumber(formData.telephone.trim()),
        ...(formData.email && { email: formData.email.trim().toLowerCase() }),
        ville: sanitizeCityName(formData.ville.trim()),
        ...(formData.adresse && { adresse: formData.adresse.trim() }),
        ...(formData.nif && { nif: formData.nif.trim() }),
        ...(formData.notes && { notes: formData.notes.trim() }),
        ...(formData.type && { type: formData.type })
      };

      await createClient(dataToSave);
      showSuccess('Client créé avec succès');
      navigate('/clients');
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setErrors({ telephone: 'Ce numéro existe déjà' });
      } else {
        showError(error.message || 'Une erreur est survenue');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux clients
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">Nouveau Client</h1>
          <p className="text-gray-600 mt-1">Créez un nouveau client pour votre entreprise</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              Informations du client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="nom" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nom complet *
                </Label>
                <Input
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Jean Mukendi"
                  className={errors.nom ? 'border-red-500' : ''}
                />
                {errors.nom && (
                  <p className="text-sm text-red-600">{errors.nom}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone *
                </Label>
                <Input
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+243 123 456 789"
                  className={errors.telephone ? 'border-red-500' : ''}
                />
                {errors.telephone && (
                  <p className="text-sm text-red-600">{errors.telephone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (optionnel)
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@exemple.cd"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Type de client
                </Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  NIF (optionnel)
                </Label>
                <Input
                  id="nif"
                  name="nif"
                  value={formData.nif}
                  onChange={handleChange}
                  placeholder="123456789012"
                  className={errors.nif ? 'border-red-500' : ''}
                />
                {errors.nif && (
                  <p className="text-sm text-red-600">{errors.nif}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse (optionnel)
                </Label>
                <Input
                  id="adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="123 Avenue du Commerce, Kinshasa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ville *
                </Label>
                <Input
                  id="ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Kinshasa"
                  className={errors.ville ? 'border-red-500' : ''}
                />
                {errors.ville && (
                  <p className="text-sm text-red-600">{errors.ville}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes (optionnel)
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange as any}
                  placeholder="Notes internes sur ce client..."
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="mr-2">Création...</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Créer le client
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/clients')}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientsNew;
