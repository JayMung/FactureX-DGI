import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CheckCircle2, Shield } from 'lucide-react';

type Role = 'admin' | 'comptable' | 'caissier' | 'viewer';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  comptable: 'Comptable',
  caissier: 'Caissier',
  viewer: 'Lecteur',
};

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Mock user data (in real app, fetch from Supabase)
  const [form, setForm] = useState({
    name: 'Jean Pambu',
    email: 'jean@monentreprise.cd',
    phone: '+243 XX XXX XXXX',
    role: 'admin' as Role,
    status: 'active',
    company: 'SARL Pambu & Fils',
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: form.role, full_name: form.name, phone: form.phone })
        .eq('id', id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => navigate('/settings/team'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <h1 className="text-lg font-bold text-slate-900">Modifier l'utilisateur</h1>
      </header>

      <main className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">JP</span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{form.name}</p>
              <p className="text-sm text-slate-400">{form.email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {error && (
              <div className="p-6 pb-0">
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {saved && (
              <div className="p-6 pb-0">
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700 text-sm">
                    Modifications enregistrées avec succès !
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Basic info */}
            <div className="p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Informations</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Nom complet</Label>
                  <Input
                    value={form.name}
                    onChange={update('name')}
                    className="border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    disabled
                    className="border-slate-200 rounded-xl text-sm bg-slate-50"
                  />
                  <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Téléphone</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    className="border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Entreprise</Label>
                  <Input
                    value={form.company}
                    disabled
                    className="border-slate-200 rounded-xl text-sm bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Rôle & Accès
              </h3>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">Rôle</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.role === value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={form.role === value}
                        onChange={update('role')}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.role === value ? 'border-emerald-500' : 'border-slate-300'
                      }`}>
                        {form.role === value && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-400">
                          {value === 'admin' && 'Accès complet'}
                          {value === 'comptable' && 'Factures & comptabilité'}
                          {value === 'caissier' && 'POS & caisse'}
                          {value === 'viewer' && 'Lecture seule'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Statut</Label>
                <select
                  value={form.status}
                  onChange={update('status')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="pending">En attente</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || saved}
                className="px-6 py-2.5 btn-primary text-white font-semibold rounded-xl text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
                {saved ? 'Enregistré !' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .btn-primary:hover { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
      `}</style>
    </div>
  );
};

export default UserEdit;
