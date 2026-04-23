import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CheckCircle2, Send, Mail, UserPlus } from 'lucide-react';

type Role = 'admin' | 'comptable' | 'caissier' | 'viewer';

const UserInvite = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    role: 'caissier' as Role,
    message: '',
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.inviteUserByEmail(form.email, {
        data: { role: form.role },
      });
      if (error) throw error;
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setForm({ email: '', role: 'caissier', message: '' });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi de l'invitation");
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
        <h1 className="text-lg font-bold text-slate-900">Inviter un utilisateur</h1>
      </header>

      <main className="p-8">
        <div className="max-w-xl mx-auto">
          {/* Hero card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 mb-8 text-white">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitez un membre dans votre équipe</h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              L'utilisateur recevra un email avec un lien pour créer son mot de passe et accéder à FactureSmart selon le rôle que vous lui attribuez.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleInvite} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {sent && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 text-sm">
                  Invitation envoyée avec succès à {form.email} !
                </AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Adresse email *
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="prenom@entreprise.cd"
                required
                className="border-slate-200 rounded-xl text-sm"
              />
            </div>

            {/* Role */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">
                Rôle *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'admin', label: 'Admin', desc: 'Accès complet' },
                  { value: 'comptable', label: 'Comptable', desc: 'Factures & Comptabilité' },
                  { value: 'caissier', label: 'Caissier', desc: 'POS & Caisse' },
                  { value: 'viewer', label: 'Lecteur', desc: 'Lecture seule' },
                ] as { value: Role; label: string; desc: string }[]).map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.role === value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      value={value}
                      checked={form.role === value}
                      onChange={update('role')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.role === value ? 'border-emerald-500' : 'border-slate-300'
                    }`}>
                      {form.role === value && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Personal message */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Message personnel <span className="text-slate-400 font-normal">(optionnel)</span>
              </Label>
              <textarea
                value={form.message}
                onChange={update('message')}
                placeholder="Bienvenue dans l'équipe ! Je vous invite à rejoindre FactureSmart pour gérer la facturation de notre entreprise..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">Ce message sera inclus dans l'email d'invitation</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || sent}
              className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : sent ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              {sent ? 'Invitation envoyée !' : loading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
            </button>
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

export default UserInvite;
