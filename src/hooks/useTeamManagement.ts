"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamRole = 'super_admin' | 'admin' | 'comptable' | 'caissier' | 'viewer';
export type TeamStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface TeamMember {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: TeamRole;
  status: TeamStatus;
  permissions: string[];
  last_login_at: string | null;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  id: string;
  company_id: string;
  email: string;
  role: TeamRole;
  token: string;
  invited_by: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface CompanyTeamInfo {
  id: string;
  name: string;
  max_team_members: number;
  active_members: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTeamMembers(companyId?: string) {
  return useQuery({
    queryKey: ['team-members', companyId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useTeamInvitations(companyId?: string) {
  return useQuery({
    queryKey: ['team-invitations', companyId],
    queryFn: async (): Promise<TeamInvitation[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCompanyTeamInfo(companyId?: string) {
  return useQuery({
    queryKey: ['company-team-info', companyId],
    queryFn: async (): Promise<CompanyTeamInfo | null> => {
      if (!companyId) return null;

      // Get company info
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, max_team_members')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Get member count
      const { count, error: countError } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (countError) throw countError;

      return {
        ...company,
        active_members: count || 0,
      };
    },
    enabled: !!companyId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      email,
      role,
    }: {
      companyId: string;
      email: string;
      role: TeamRole;
    }) => {
      // Call Edge Function to send invitation email
      const { data, error } = await supabase.functions.invoke('api-team-invite', {
        body: { companyId, email, role },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_data, variables) => {
      showSuccess(`Invitation envoyée à ${variables.email}`);
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: Error) => {
      showError(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: TeamRole;
    }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Rôle mis à jour');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: Error) => {
      showError(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      status,
    }: {
      memberId: string;
      status: TeamStatus;
    }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Statut mis à jour');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: Error) => {
      showError(`Erreur: ${error.message}`);
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Membre retiré de l\'équipe');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: Error) => {
      showError(`Erreur: ${error.message}`);
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Invitation annulée');
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    },
    onError: (error: Error) => {
      showError(`Erreur: ${error.message}`);
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  const inviteMutation = useInviteMember();

  return useMutation({
    mutationFn: async (invitation: TeamInvitation) => {
      return inviteMutation.mutateAsync({
        companyId: invitation.company_id,
        email: invitation.email,
        role: invitation.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    },
  });
}
