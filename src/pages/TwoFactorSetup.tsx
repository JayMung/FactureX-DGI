"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  ShieldCheck,
  Scan,
  CheckCircle,
  AlertCircle,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
  Download,
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Types
interface TwoFAStatus {
  isEnabled: boolean;
  enabledAt: string | null;
  hasRecoveryCodes: boolean;
}

export default function TwoFactorSetup() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 2FA State
  const [status, setStatus] = useState<TwoFAStatus>({
    isEnabled: false,
    enabledAt: null,
    hasRecoveryCodes: false,
  });
  const [showSetup, setShowSetup] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [codesSaved, setCodesSaved] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [step, setStep] = useState<'initial' | 'scan' | 'verify' | 'codes' | 'done'>('initial');
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [recoveryCodeForDisable, setRecoveryCodeForDisable] = useState('');

  // Fetch 2FA status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // We'll call an edge function endpoint if available, or check via supabase directly
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData?.user?.id;

      if (!userId) {
        setError('Utilisateur non connecté');
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from('user_2fa')
        .select('is_enabled, enabled_at, recovery_codes')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

      if (data) {
        setStatus({
          isEnabled: data.is_enabled,
          enabledAt: data.enabled_at,
          hasRecoveryCodes: data.recovery_codes && data.recovery_codes.length > 0,
        });
      }
    } catch (err: any) {
      // Table might not exist yet
      if (err.code !== '42P01') {
        console.error('Error fetching 2FA status:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate 2FA secret
  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep('scan');

      // Generate TOTP secret
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || 'user@facturesmart.com';

      // Try to call edge function if available, fallback to client-side generation
      let totpSecret: string;
      let qrDataUri: string;

      try {
        const { data: genData, error: genErr } = await supabase.functions.invoke('api-2fa', {
          body: { action: 'generate' },
        });
        if (!genErr && genData) {
          totpSecret = genData.secret;
          qrDataUri = genData.qr_code;
        } else {
          throw genErr || new Error('Edge function unavailable');
        }
      } catch {
        // Fallback: client-side TOTP secret generation with QR code
        const { default: OTPAuth } = await import('otpauth');
        const { default: QRCode } = await import('qrcode');

        const totp = new OTPAuth.TOTP({
          issuer: 'FactureSmart',
          label: email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
        });

        totpSecret = totp.secret.base32;
        qrDataUri = await QRCode.toDataURL(totp.toString());
      }

      setSecret(totpSecret);
      setQrCode(qrDataUri);
      setStep('verify');

      // Save secret to DB
      const recoveryCodesArr = Array.from({ length: 8 }, () =>
        Array.from({ length: 4 }, () =>
          Math.random().toString(36).substring(2, 4).toUpperCase()
        ).join('-')
      );

      const { error: upsertErr } = await supabase.from('user_2fa').upsert({
        user_id: userData?.user?.id,
        totp_secret: totpSecret,
        recovery_codes: recoveryCodesArr,
        is_enabled: false,
      }, {
        onConflict: 'user_id',
      });

      if (upsertErr && upsertErr.code !== '23505') {
        console.warn('Failed to save 2FA secret:', upsertErr);
      }

      setRecoveryCodes(recoveryCodesArr);
    } catch (err: any) {
      console.error('Error setting up 2FA:', err);
      setError(err.message || 'Erreur lors de la configuration 2FA');
      setStep('initial');
    } finally {
      setLoading(false);
    }
  };

  // Verify TOTP code
  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    try {
      setVerifying(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();

      const { error: verifyErr } = await supabase.functions.invoke('api-2fa', {
        body: {
          action: 'verify',
          code: verificationCode,
          user_id: userData?.user?.id,
        },
      });

      if (verifyErr) {
        // Fallback: client-side verification
        if (!secret) throw new Error('No secret available');
        const { default: OTPAuth } = await import('otpauth');
        const totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(secret),
        });
        const delta = totp.validate({ token: verificationCode, window: 1 });

        if (delta === null) {
          setError('Code invalide. Veuillez réessayer.');
          setVerifying(false);
          return;
        }
      }

      // Enable 2FA
      const { error: enableErr } = await supabase
        .from('user_2fa')
        .update({
          is_enabled: true,
          enabled_at: new Date().toISOString(),
        })
        .eq('user_id', userData?.user?.id);

      if (enableErr) throw enableErr;

      setStep('codes');
      await fetchStatus();
    } catch (err: any) {
      console.error('Error verifying 2FA:', err);
      setError(err.message || 'Code de vérification invalide');
    } finally {
      setVerifying(false);
    }
  };

  // Complete setup (after saving recovery codes)
  const handleComplete = () => {
    if (!codesSaved) {
      setError('Veuillez confirmer avoir sauvegardé vos codes de récupération');
      return;
    }
    setStep('done');
    setShowSetup(false);
    setSuccess('Authentification à deux facteurs activée avec succès !');
    setTimeout(() => setSuccess(null), 5000);
  };

  // Disable 2FA
  const handleDisable = async () => {
    try {
      setDisabling(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();

      const { error: disableErr } = await supabase.functions.invoke('api-2fa', {
        body: {
          action: 'disable',
          user_id: userData?.user?.id,
          code: recoveryCodeForDisable || undefined,
        },
      });

      if (disableErr) {
        // Fallback: direct disable
        const { error: delErr } = await supabase
          .from('user_2fa')
          .update({
            is_enabled: false,
            enabled_at: null,
          })
          .eq('user_id', userData?.user?.id);

        if (delErr) throw delErr;
      }

      setConfirmDisable(false);
      setRecoveryCodeForDisable('');
      await fetchStatus();
      setSuccess('Authentification à deux facteurs désactivée.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error disabling 2FA:', err);
      setError(err.message || 'Erreur lors de la désactivation');
    } finally {
      setDisabling(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Authentification à Deux Facteurs (2FA)
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              {status.isEnabled ? (
                <ShieldCheck className="h-6 w-6 text-green-500" />
              ) : (
                <Lock className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {status.isEnabled ? '2FA Activée' : '2FA Non configurée'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status.isEnabled
                    ? `Activée le ${status.enabledAt ? new Date(status.enabledAt).toLocaleDateString('fr-FR') : ''}`
                    : 'Protégez votre compte avec une deuxième couche de vérification'}
                </p>
              </div>
            </div>
            <Badge variant={status.isEnabled ? 'default' : 'secondary'}>
              {status.isEnabled ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {/* Actions */}
          {!status.isEnabled ? (
            <Button onClick={handleSetup} disabled={loading}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Configurer le 2FA
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmDisable(true)}
              disabled={disabling}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Désactiver le 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Modal */}
      <Dialog open={showSetup} onOpenChange={(open) => !open && setShowSetup(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration 2FA</DialogTitle>
            <DialogDescription>
              {step === 'scan' && 'Scannez le QR code avec votre application d\'authentification'}
              {step === 'verify' && 'Entrez le code à 6 chiffres de votre application'}
              {step === 'codes' && 'Sauvegardez vos codes de récupération'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 2: Verify */}
          {step === 'verify' && qrCode && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Ou entrez cette clé manuellement :</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border truncate font-mono">
                    {secret}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(secret || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={verifying || verificationCode.length < 6}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Vérifier et activer
              </Button>
            </div>
          )}

          {/* Step 3: Recovery Codes */}
          {step === 'codes' && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-yellow-500 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Important !</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Ces codes sont vos seuls moyens de récupération. Sauvegardez-les dans un endroit sûr.
                  Si vous perdez l'accès à votre application d'authentification et ces codes,
                  vous ne pourrez plus vous connecter à votre compte.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-1">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>{i + 1}. {code}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-green-400 hover:text-white"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = recoveryCodes.join('\n');
                    navigator.clipboard.writeText(text);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Tout copier
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `facturesmart-2fa-codes-${new Date().toISOString().slice(0, 10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setCodesSaved(true);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={codesSaved}
                  onChange={(e) => setCodesSaved(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">J'ai sauvegardé mes codes de récupération</span>
              </label>

              <Button className="w-full" onClick={handleComplete} disabled={!codesSaved}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer la configuration
              </Button>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">2FA Activée !</h3>
              <p className="text-muted-foreground mt-2">
                Votre compte est maintenant protégé par l'authentification à deux facteurs.
              </p>
              <Button className="mt-6" onClick={() => setShowSetup(false)}>
                Terminé
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver le 2FA</DialogTitle>
            <DialogDescription>
              Cette action réduit la sécurité de votre compte. Veuillez confirmer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                La désactivation du 2FA rend votre compte vulnérable aux accès non autorisés.
              </AlertDescription>
            </Alert>

            {status.hasRecoveryCodes && (
              <div className="space-y-2">
                <Label>Code de récupération (optionnel)</Label>
                <Input
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={recoveryCodeForDisable}
                  onChange={(e) => setRecoveryCodeForDisable(e.target.value)}
                  className="font-mono"
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDisable(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDisable} disabled={disabling}>
                {disabling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Confirmer la désactivation
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
