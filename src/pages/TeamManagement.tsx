import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, UserPlus, MoreVertical, Search, Shield, Users, FileText } from 'lucide-react';
import {
  useTeamMembers,
  useTeamInvitations,
  useCompanyTeamInfo,
  useInviteMember,
  useUpdateMemberRole,
  useUpdateMemberStatus,
  useRemoveMember,
  useCancelInvitation,
  useResendInvitation,
  type TeamMember,
  type TeamRole,
  type TeamStatus,
} from '@/hooks/useTeamManagement';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'users' | 'roles' | 'activity';

const ROLE_COLORS: Record<TeamRole, { bg: string; text: string; border: string }> = {
  super_admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  comptable: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  caissier: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  viewer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const ROLE_LABELS: Record<TeamRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  comptable: 'Comptable',
  caissier: 'Caissier',
  viewer: 'Lecteur',
};

const STATUS_LABELS: Record<TeamStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
  suspended: 'Suspendu',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getColorClass(name: string): string {
  const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600', 'bg-teal-600'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const UserRow = ({
  member,
  onEdit,
  onRemove,
}: {
  member: TeamMember;
  onEdit: (m: TeamMember) => void;
  onRemove: (id: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const colors = ROLE_COLORS[member.role];

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${getColorClass(member.full_name)} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-sm font-bold text-white">
              {getInitials(member.full_name)}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{member.full_name}</p>
            <p className="text-xs text-slate-400">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
          {ROLE_LABELS[member.role]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${member.status === 'active' ? 'text-emerald-700' : member.status === 'pending' ? 'text-amber-600' : 'text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : member.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'}`} />
          {STATUS_LABELS[member.status]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-slate-500">
          {member.last_login_at
            ? new Date(member.last_login_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Jamais'}
        </span>
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
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
              <button
                onClick={() => { onEdit(member); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="ri-edit-line text-base" /> Modifier le rôle
              </button>
              <button
                onClick={() => {
                  onRemove(member.id);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <i className="ri-delete-bin-line text-base" /> Retirer de l'équipe
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Invitation Row ───────────────────────────────────────────────────────────

const InvitationRow = ({
  invitation,
  onCancel,
  onResend,
}: {
  invitation: import('@/hooks/useTeamManagement').TeamInvitation;
  onCancel: (id: string) => void;
  onResend: (inv: import('@/hooks/useTeamManagement').TeamInvitation) => void;
}) => {
  const colors = ROLE_COLORS[invitation.role];
  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <tr className="hover:bg-slate-50 transition-colors opacity-70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{invitation.email}</p>
            <p className="text-xs text-amber-600">En attente d'acceptation</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
          {ROLE_LABELS[invitation.role]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-amber-500'}`} />
          {isExpired ? 'Expiré' : `Expire le ${new Date(invitation.expires_at).toLocaleDateString('fr-FR')}`}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs text-slate-500">{new Date(invitation.created_at).toLocaleDateString('fr-FR')}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {!isExpired && (
            <button
              onClick={() => onResend(invitation)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Renvoyer
            </button>
          )}
          <button
            onClick={() => onCancel(invitation.id)}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Annuler
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Invite Modal ─────────────────────────────────────────────────────────────

const InviteModal = ({
  open,
  onClose,
  companyId,
}: {
  open: boolean;
  onClose: () => void;
  companyId?: string;
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('viewer');
  const inviteMember = useInviteMember();

  if (!open) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    await inviteMember.mutateAsync({ companyId, email, role });
    setEmail('');
    onClose();
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
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none"
            >
              {(Object.entries(ROLE_LABELS) as [TeamRole, string][]).map(([value, label]) => (
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
              disabled={inviteMember.isPending}
              className="flex-1 btn-primary text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {inviteMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
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

// ─── Edit Role Modal ──────────────────────────────────────────────────────────

const EditRoleModal = ({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) => {
  const [role, setRole] = useState<TeamRole>(member.role);
  const updateRole = useUpdateMemberRole();

  if (!member) return null;

  const handleSave = async () => {
    await updateRole.mutateAsync({ memberId: member.id, role });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Modifier le rôle</h2>
        <p className="text-sm text-slate-500 mb-5">{member.full_name}</p>

        <div className="space-y-3">
          {(Object.entries(ROLE_LABELS) as [TeamRole, string][]).map(([value, label]) => (
            <label
              key={value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                role === value
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                role === value ? 'border-emerald-500' : 'border-slate-300'
              }`}>
                {role === value && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
              </div>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={updateRole.isPending}
            className="flex-1 py-2.5 btn-primary text-white font-semibold rounded-xl text-sm disabled:opacity-60"
          >
            {updateRole.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Enregistrer'}
          </button>
        </div>
      </div>
      <style>{`.btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }`}</style>
    </div>
  );
};

// ─── RolesTab ─────────────────────────────────────────────────────────────────

const RolesTab = ({ members }: { members: TeamMember[] }) => {
  const roleOrder: TeamRole[] = ['admin', 'comptable', 'caissier', 'viewer'];

  return (
    <div className="space-y-6">
      {roleOrder.map((role) => {
        const colors = ROLE_COLORS[role];
        const count = members.filter((m) => m.role === role && m.status === 'active').length;
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
                    {count} utilisateur(s)
                  </span>
                </div>
                <div className="space-y-1">
                  {role === 'admin' && ['Toutes les permissions', 'Gestion des utilisateurs', 'Paramètres entreprise', 'Suppression de données'].map((p) => (
                    <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                    </p>
                  ))}
                  {role === 'comptable' && ['Création/modification factures', 'Gestion clients', 'Comptabilité OHADA', 'Rapports TVA'].map((p) => (
                    <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                    </p>
                  ))}
                  {role === 'caissier' && ['Interface POS', 'Encaissements', 'Ouverture/fermeture caisse', 'Reçus'].map((p) => (
                    <p key={p} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                    </p>
                  ))}
                  {role === 'viewer' && ['Lecture des factures', 'Tableaux de bord', 'Rapports', 'Pas de modification'].map((p) => (
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
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeamManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);

  // Get current user's company
  const { data: currentProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  const companyId = currentProfile?.company_id;

  const { data: members = [], isLoading: membersLoading } = useTeamMembers(companyId);
  const { data: invitations = [], isLoading: invitationsLoading } = useTeamInvitations(companyId);
  const { data: companyInfo } = useCompanyTeamInfo(companyId);

  const removeMember = useRemoveMember();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  const filtered = members.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (membersLoading || invitationsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rôles & Permissions</h1>
          <p className="text-sm text-slate-500">
            Gérez les accès de votre équipe
            {companyInfo && (
              <span className="ml-2 text-xs text-slate-400">
                ({members.filter((m) => m.status === 'active').length}/{companyInfo.max_team_members} membres)
              </span>
            )}
          </p>
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

            {/* Members table */}
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
                {filtered.map((m) => (
                  <UserRow key={m.id} member={m} onEdit={setEditMember} onRemove={(id) => removeMember.mutate(id)} />
                ))}
              </tbody>
            </table>

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <>
                <div className="px-6 py-3 bg-amber-50 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Invitations en attente
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-amber-50">
                    <tr>
                      {['Email', 'Rôle', 'Expiration', 'Envoyée', ''].map((h) => (
                        <th key={h} className={`px-6 py-3 text-left text-[10px] font-bold text-amber-700 uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invitations.map((inv) => (
                      <InvitationRow
                        key={inv.id}
                        invitation={inv}
                        onCancel={(id) => cancelInvitation.mutate(id)}
                        onResend={(inv) => resendInvitation.mutate(inv)}
                      />
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {activeTab === 'roles' && <RolesTab members={members} />}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Journaux d'activité de l'équipe — à implémenter dans la phase suivante</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} companyId={companyId} />
      {editMember && (
        <EditRoleModal member={editMember} onClose={() => setEditMember(null)} />
      )}

      <style>{`
        .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .btn-primary:hover { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
      `}</style>
    </div>
  );
};

export default TeamManagement;
