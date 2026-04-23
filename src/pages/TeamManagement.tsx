import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, UserPlus, MoreVertical, Search, Shield, Users, FileText } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'admin' | 'comptable' | 'caissier' | 'viewer';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  initials: string;
  color: string;
}

const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string }> = {
  admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  comptable: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  caissier: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  viewer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  comptable: 'Comptable',
  caissier: 'Caissier',
  viewer: 'Lecteur',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  { id: '1', name: 'Jean Pambu', email: 'jean@monentreprise.cd', role: 'admin', status: 'active', lastLogin: "Aujourd'hui, 14:32", initials: 'JP', color: 'bg-emerald-600' },
  { id: '2', name: 'Marie Kabongo', email: 'marie@monentreprise.cd', role: 'comptable', status: 'active', lastLogin: 'Hier, 17:45', initials: 'MK', color: 'bg-slate-100' },
  { id: '3', name: 'Thierry Disashi', email: 'thierry@monentreprise.cd', role: 'caissier', status: 'active', lastLogin: 'Il y a 2 jours', initials: 'TD', color: 'bg-amber-100' },
  { id: '4', name: 'Aimé Nseka', email: 'aime@monentreprise.cd', role: 'viewer', status: 'inactive', lastLogin: 'Il y a 2 semaines', initials: 'AN', color: 'bg-blue-100' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const UserRow = ({ user, onEdit }: { user: User; onEdit: (u: User) => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const colors = ROLE_COLORS[user.role];

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${user.color} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className={`text-sm font-bold ${user.role === 'admin' ? 'text-white' : 'text-slate-700'}`}>
              {user.initials}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
          {ROLE_LABELS[user.role]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {user.status === 'active' ? 'Actif' : user.status === 'pending' ? 'En attente' : 'Inactif'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-slate-500">{user.lastLogin}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
              <button
                onClick={() => { onEdit(user); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="ri-edit-line text-base" /> Modifier
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="ri-lock-line text-base" /> Réinitialiser mdp
              </button>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <i className="ri-delete-bin-line text-base" /> Désactiver
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Invite Modal ─────────────────────────────────────────────────────────────

const InviteModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Invite via Supabase Auth
      const { error } = await supabase.auth.inviteUserByEmail(email, {
        data: { role },
      });
      if (error) throw error;
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Inviter un utilisateur</h2>
          <p className="text-sm text-slate-500 mt-1">Ils recevront un email d'invitation</p>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-5">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@entreprise.cd"
              required
              className="border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Rôle</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none"
            >
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-400 space-y-1">
              <p><strong>Admin :</strong> Accès complet à toutes les fonctionnalités</p>
              <p><strong>Comptable :</strong> Factures, clients, comptabilité</p>
              <p><strong>Caissier :</strong> POS, encaissements</p>
              <p><strong>Lecteur :</strong> Lecture seule (dashboards, rapports)</p>
            </div>
          </div>

          {sent && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700 text-sm">
                Invitation envoyée avec succès !
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Envoyer l'invitation
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .btn-primary:hover { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
        .animate-in { animation: animate-in 0.2s ease-out; }
        @keyframes animate-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

// ─── RolesTab ─────────────────────────────────────────────────────────────────

const RolesTab = () => (
  <div className="space-y-6">
    {(['admin', 'comptable', 'caissier', 'viewer'] as Role[]).map((role) => {
      const colors = ROLE_COLORS[role];
      return (
        <div key={role} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${colors.bg} ${colors.border} border rounded-2xl flex items-center justify-center`}>
              <Shield className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-bold text-slate-900">{ROLE_LABELS[role]}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {MOCK_USERS.filter(u => u.role === role).length} utilisateur(s)
                </span>
              </div>
              <div className="space-y-1">
                {role === 'admin' && ['Toutes les permissions', 'Gestion des utilisateurs', 'Paramètres entreprise', 'Suppression de données'].map(p => (
                  <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                  </p>
                ))}
                {role === 'comptable' && ['Création/modification factures', 'Gestion clients', 'Comptabilité OHADA', 'Rapports TVA'].map(p => (
                  <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                  </p>
                ))}
                {role === 'caissier' && ['Interface POS', 'Encaissements', 'Ouverture/fermeture caisse', 'Reçus'].map(p => (
                  <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                  </p>
                ))}
                {role === 'viewer' && ['Lecture des factures', 'Tableaux de bord', 'Rapports', 'Pas de modification'].map(p => (
                  <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'users' | 'roles' | 'activity';

const TeamManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [users] = useState<User[]>(MOCK_USERS);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rôles & Permissions</h1>
          <p className="text-sm text-slate-500">Gérez les accès de votre équipe</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 btn-primary text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 flex gap-6">
        {([
          { id: 'users' as Tab, icon: Users, label: 'Utilisateurs' },
          { id: 'roles' as Tab, icon: Shield, label: 'Rôles' },
          { id: 'activity' as Tab, icon: FileText, label: "Journaux d'activité" },
        ]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`py-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === id
                ? 'text-emerald-600 border-emerald-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <main className="p-8">
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="relative">
                <Search className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 w-64"
                />
              </div>
              <span className="text-xs text-slate-400">{filtered.length} utilisateur(s)</span>
            </div>

            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Utilisateur', 'Rôle', 'Statut', 'Dernière connexion', ''].map((h) => (
                    <th key={h} className={`px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => (
                  <UserRow key={u.id} user={u} onEdit={setEditUser} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && <RolesTab />}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Journaux d'activité — à implémenter</p>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />

      <style>{`
        .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .btn-primary:hover { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
      `}</style>
    </div>
  );
};

export default TeamManagement;
