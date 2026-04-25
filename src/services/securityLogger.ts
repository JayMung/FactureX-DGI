/**
 * Security Logger Service — FactureSmart COD-56
 * Replaces the no-op stub with real security event logging to Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'signup_success'
  | 'signup_failed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_verification_sent'
  | 'email_verified'
  | 'permission_denied'
  | 'admin_access_granted'
  | 'role_changed'
  | 'sensitive_data_accessed'
  | 'bulk_export'
  | 'data_deleted'
  | 'data_modified'
  | 'rate_limit_exceeded'
  | 'csrf_token_invalid'
  | 'ssrf_attempt_blocked'
  | 'xss_attempt_blocked'
  | 'sql_injection_attempt'
  | 'suspicious_activity'
  | 'user_created'
  | 'user_deleted'
  | 'organization_created'
  | 'organization_deleted'
  | 'settings_changed';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export interface SecurityLogDetails {
  [key: string]: any;
}

export interface SecurityLogOptions {
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: SecurityLogDetails;
}

/**
 * Core security event logger — writes to Supabase security_logs table.
 * Failures are silently logged to console.error to avoid breaking user flows.
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  options: SecurityLogOptions = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = options.userId || user?.id || null;

    const { error } = await supabase.from('security_logs').insert({
      user_id: userId,
      event_type: eventType,
      severity,
      resource_type: options.details?.resourceType || null,
      resource_id: options.details?.resourceId || null,
      details: options.details || {},
      ip_address: options.ipAddress || null,
      user_agent: options.userAgent || navigator.userAgent,
    });

    if (error) {
      console.error('[SecurityLogger] Failed to write log:', error);
    }
  } catch (err) {
    console.error('[SecurityLogger] Unexpected error:', err);
  }
}

export async function logLoginSuccess(email: string): Promise<void> {
  await logSecurityEvent('login_success', 'info', { details: { email } });
}

export async function logLoginFailed(email: string, reason?: string): Promise<void> {
  await logSecurityEvent('login_failed', 'warning', { details: { email, reason } });
}

export async function logLogout(): Promise<void> {
  await logSecurityEvent('logout', 'info');
}

export async function logSignupSuccess(email: string): Promise<void> {
  await logSecurityEvent('signup_success', 'info', { details: { email } });
}

export async function logSignupFailed(email: string, reason?: string): Promise<void> {
  await logSecurityEvent('signup_failed', 'warning', { details: { email, reason } });
}

export async function logPermissionDenied(resource: string, action: string): Promise<void> {
  await logSecurityEvent('permission_denied', 'warning', { details: { resource, action } });
}

export async function logAdminAccess(action: string): Promise<void> {
  await logSecurityEvent('admin_access_granted', 'warning', { details: { action } });
}

export async function logRateLimitExceeded(endpoint: string, attempts: number): Promise<void> {
  await logSecurityEvent('rate_limit_exceeded', 'warning', { details: { endpoint, attempts } });
}

export async function logCSRFInvalid(endpoint: string): Promise<void> {
  await logSecurityEvent('csrf_token_invalid', 'warning', { details: { endpoint } });
}

export async function logSuspiciousActivity(reason: string, details?: SecurityLogDetails): Promise<void> {
  await logSecurityEvent('suspicious_activity', 'critical', { details: { reason, ...details } });
}

export async function logSensitiveDataAccess(dataType: string, recordId?: string): Promise<void> {
  await logSecurityEvent('sensitive_data_accessed', 'info', { details: { dataType, recordId } });
}

export async function logBulkExport(dataType: string, recordCount: number): Promise<void> {
  await logSecurityEvent('bulk_export', 'info', { details: { dataType, recordCount } });
}

export async function logDataDeleted(dataType: string, recordId: string): Promise<void> {
  await logSecurityEvent('data_deleted', 'warning', { details: { dataType, recordId } });
}

export async function logSettingsChanged(settingName: string, oldValue?: any, newValue?: any): Promise<void> {
  await logSecurityEvent('settings_changed', 'info', { details: { settingName, oldValue, newValue } });
}

export async function getRecentSecurityEvents(
  limit: number = 100,
  severity?: SecuritySeverity,
  eventType?: SecurityEventType
) {
  try {
    let query = supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) query = query.eq('severity', severity);
    if (eventType) query = query.eq('event_type', eventType);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[SecurityLogger] Failed to fetch logs:', err);
    return [];
  }
}

export async function getSecurityDashboard() {
  try {
    const { data, error } = await supabase
      .from('security_logs')
      .select('severity, event_type, count')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const summary = {
      total: data?.length || 0,
      critical: data?.filter((d: any) => d.severity === 'critical').length || 0,
      warning: data?.filter((d: any) => d.severity === 'warning').length || 0,
      info: data?.filter((d: any) => d.severity === 'info').length || 0,
    };

    return summary;
  } catch (err) {
    console.error('[SecurityLogger] Failed to build dashboard:', err);
    return { total: 0, critical: 0, warning: 0, info: 0 };
  }
}
