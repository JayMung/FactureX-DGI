"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
  AlertCircle,
  UserCheck,
  Settings2,
  Lock,
  Users,
  FileText,
  BarChart3,
  ShoppingCart,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

// --- Types ---

interface CustomRole {
  id: string;
  company_id: string | null;
  name: string;
  description: string;
  permissions: Record<string, { read: boolean; create: boolean; delete: boolean }>;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  custom_role_id: string | null;
  custom_role_name?: string;
  is_active: boolean;
}

const MODULES = [
  { key: 'factures', label: 'Factures', icon: FileText },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'comptabilite', label: 'Comptabilité', icon: Settings2 },
  { key: 'rapports', label: 'Rapports', icon: BarChart3 },
  { key: 'parametres', label: 'Paramètres', icon: Settings2 },
  { key: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { key: 'pos', label: 'Point de Vente', icon: ShoppingCart },
  { key: 'caisse', label: 'Caisse', icon: Banknote },
];

const PERM_KEYS: { key: 'read' | 'create' | 'delete'; label: string }[] = [
  { key: 'read', label: 'Lecture' },
  { key: 'create', label: 'Écriture' },
  { key: 'delete', label: 'Suppression' },
];

// --- Component ---

export default function RBACManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Data
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Editing
  const [editDialog, setEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPermissions, setEditPermissions] = useState<Record<string, { read: boolean; create: boolean; delete: boolean }>>({});
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // User role assignment
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignUser, setAssignUser] = useState<UserProfile | null>(null);
  const [assignRole, setAssignRole] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      if (!profile?.company_id) throw new Error('Aucune entreprise');

      setCompanyId(profile.company_id);

      // Fetch custom roles for this company + system roles
      const { data: rolesData, error: rolesErr } = await supabase
        .from('custom_roles')
        .select('*')
        .or(`company_id.eq.${profile.company_id},company_id.is.null`)
        .order('name');

      if (rolesErr) throw rolesErr;
      setRoles(rolesData || []);

      // Fetch users
      const { data: usersData, error: usersErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, custom_role_id, is_active')
        .eq('company_id', profile.company_id)
        .order('full_name');

      if (usersErr) throw usersErr;

      // Enrich with custom role names
      const enrichedUsers = (usersData || []).map(u => ({
        ...u,
        custom_role_name: rolesData?.find(r => r.id === u.custom_role_id)?.name || undefined,
      }));
      setUsers(enrichedUsers);
    } catch (err: any) {
      console.error('Error fetching RBAC data:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (role?: CustomRole) => {
    if (role) {
      setEditingRole(role);
      setEditName(role.name);
      setEditDesc(role.description || '');
      setEditPermissions({ ...role.permissions });
    } else {
      setEditingRole(null);
      setEditName('');
      setEditDesc('');
      // Default: all false
      setEditPermissions(
        Object.fromEntries(
          MODULES.map(m => [m.key, { read: false, create: false, delete: false }])
        )
      );
    }
    setEditDialog(true);
  };

  const handleSaveRole = async () => {
    if (!editName.trim()) {
      setError('Le nom du rôle est requis');
      return;
    }
    if (!companyId) return;

    try {
      setSaving(true);
      setError(null);

      if (editingRole && !editingRole.is_system) {
        // Update
        const { error: updateErr } = await supabase
          .from('custom_roles')
          .update({
            name: editName.trim(),
            description: editDesc,
            permissions: editPermissions,
          })
          .eq('id', editingRole.id);

        if (updateErr) throw updateErr;
        toast({ title: '✅ Rôle mis à jour' });
      } else {
        // Create
        const { error: insertErr } = await supabase
          .from('custom_roles')
          .insert({
            company_id: companyId,
            name: editName.trim(),
            description: editDesc,
            permissions: editPermissions,
            is_system: false,
          });

        if (insertErr) throw insertErr;
        toast({ title: '✅ Rôle créé' });
      }

      setEditDialog(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error saving role:', err);
      setError(err.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      setError(null);

      const { error: delErr } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', deleteConfirm);

      if (delErr) throw delErr;

      toast({ title: '✅ Rôle supprimé' });
      setDeleteConfirm(null);
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Erreur de suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignRole = async () => {
    if (!assignUser || !assignRole) return;

    try {
      setSaving(true);
      setError(null);

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          custom_role_id: assignRole === '__none__' ? null : assignRole,
        })
        .eq('id', assignUser.id);

      if (updateErr) throw updateErr;

      toast({ title: '✅ Rôle attribué' });
      setAssignDialog(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError(err.message || 'Erreur d\'attribution');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      toast({
        title: user.is_active ? '❌ Utilisateur désactivé' : '✅ Utilisateur réactivé',
      });
      await fetchData();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setError(err.message);
    }
  };

  const togglePermission = (module: string, perm: 'read' | 'create' | 'delete') => {
    setEditPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [perm]: !prev[module]?.[perm],
      },
    }));
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Rôles & Permissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les accès et autorisations des utilisateurs
          </p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {role.name}
                        {role.is_system && (
                          <Badge variant="secondary" className="text-xs">Système</Badge>
                        )}
                      </CardTitle>
                      {role.description && (
                        <CardDescription className="mt-1">{role.description}</CardDescription>
                      )}
                    </div>
                    {!role.is_system && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(role)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteConfirm(role.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {MODULES.map(mod => {
                      const perm = role.permissions?.[mod.key];
                      const enabled = perm?.read || perm?.create || perm?.delete;
                      return (
                        <div key={mod.key} className="flex items-center justify-between text-sm py-0.5">
                          <span className="text-muted-foreground">{mod.label}</span>
                          <div className="flex items-center gap-2">
                            {PERM_KEYS.map(pk => (
                              <span
                                key={pk.key}
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  perm?.[pk.key]
                                    ? 'bg-green-100 text-green-700 font-medium'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {pk.key === 'read' ? 'R' : pk.key === 'create' ? 'W' : 'D'}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.custom_role_name || user.role || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAssignUser(user);
                              setAssignRole(user.custom_role_id || '__none__');
                              setAssignDialog(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Rôle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleUserStatus(user)}
                            className={!user.is_active ? 'text-green-600' : 'text-red-600'}
                          >
                            {user.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
            </DialogTitle>
            <DialogDescription>
              Définissez les permissions pour ce rôle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du rôle</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ex: Superviseur"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description du rôle"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Permissions par module</p>
              {MODULES.map(mod => {
                const perm = editPermissions[mod.key] || { read: false, create: false, delete: false };
                return (
                  <div key={mod.key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <mod.icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{mod.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {PERM_KEYS.map(pk => (
                        <label key={pk.key} className="flex items-center gap-1 cursor-pointer">
                          <Switch
                            checked={perm[pk.key]}
                            onCheckedChange={() => togglePermission(mod.key, pk.key)}
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground">{pk.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un rôle</DialogTitle>
            <DialogDescription>
              {assignUser?.full_name || assignUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="__none__">Aucun (rôle par défaut)</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignRole} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Attribuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rôle</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les utilisateurs ayant ce rôle perdront leurs permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
