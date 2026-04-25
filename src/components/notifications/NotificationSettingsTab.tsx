/**
 * NotificationSettingsTab — Settings page tab for notification preferences
 * Phase 7: Toggle categories, push, quiet hours
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';
import { NOTIFICATION_CATEGORY_LABELS, NOTIFICATION_CATEGORY_ICONS } from '@/types/notifications';
import type { NotificationPreferences, NotificationCategory } from '@/types/notifications';
import {
  Bell,
  BellOff,
  Smartphone,
  Mail,
  Clock,
  Loader2,
  Info,
} from 'lucide-react';

const CATEGORIES: { key: NotificationCategory; description: string }[] = [
  {
    key: 'transaction',
    description: 'Paiements, encaissements et transactions financières',
  },
  {
    key: 'facture',
    description: 'Création, modification et statut des factures',
  },
  {
    key: 'client',
    description: 'Nouveaux clients, modifications de compte',
  },
  {
    key: 'caisse',
    description: 'Ouverture, fermeture et mouvements de caisse',
  },
  {
    key: 'system',
    description: 'Mises à jour système, rapports générés',
  },
  {
    key: 'team',
    description: 'Invitations, changements de rôle dans l\'équipe',
  },
];

export function NotificationSettingsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getPreferences();
      setPrefs(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean | string | null
  ) => {
    if (!prefs) return;

    setSaving(true);
    try {
      const success = await notificationService.updatePreferences({
        [key]: value,
      } as Partial<NotificationPreferences>);

      if (success) {
        setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev));
        toast({
          title: 'Préférence mise à jour',
          description: 'Vos préférences de notification ont été enregistrées.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la préférence.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPushPermission();
      if (!granted) {
        toast({
          title: 'Permission refusée',
          description:
            'Veuillez autoriser les notifications dans les paramètres de votre navigateur.',
          variant: 'destructive',
        });
        return;
      }

      const subscribed = await notificationService.subscribeToPush();
      if (subscribed) {
        setPushEnabled(true);
        toast({
          title: 'Notifications push activées',
          description: 'Vous recevrez désormais des notifications même hors de l\'application.',
        });
      }
    } else {
      const unsubscribed = await notificationService.unsubscribeFromPush();
      if (unsubscribed) {
        setPushEnabled(false);
        toast({
          title: 'Notifications push désactivées',
          description: 'Vous ne recevrez plus de notifications push.',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Impossible de charger les préférences. Veuillez réessayer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canaux de notification
          </CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez recevoir les notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* In-app */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="in-app">Dans l'application</Label>
                <p className="text-xs text-muted-foreground">
                  Notifications affichées dans l'icône de cloche
                </p>
              </div>
            </div>
            <Switch
              id="in-app"
              checked={prefs.in_app_enabled}
              onCheckedChange={(v) => updatePreference('in_app_enabled', v)}
              disabled={saving}
            />
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push">Notifications push</Label>
                <p className="text-xs text-muted-foreground">
                  Alertes sur votre appareil même si l'application est fermée
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={pushEnabled}
              onCheckedChange={handlePushToggle}
              disabled={saving || !pushSupported}
            />
          </div>

          {!pushSupported && (
            <Alert variant="default" className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle>Non supporté</AlertTitle>
              <AlertDescription>
                Les notifications push ne sont pas supportées par votre navigateur.
                Utilisez Chrome, Edge ou Firefox pour activer cette fonctionnalité.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email">Email</Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir un résumé par email (prochainement)
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={prefs.email_enabled}
              onCheckedChange={(v) => updatePreference('email_enabled', v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Catégories de notifications
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les notifications par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CATEGORIES.map((cat, index) => (
            <div key={cat.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {NOTIFICATION_CATEGORY_ICONS[cat.key]}
                  </span>
                  <div>
                    <Label htmlFor={`cat-${cat.key}`}>
                      {NOTIFICATION_CATEGORY_LABELS[cat.key]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`cat-${cat.key}`}
                  checked={
                    prefs[
                      `notify_${cat.key}` as keyof NotificationPreferences
                    ] as boolean
                  }
                  onCheckedChange={(v) =>
                    updatePreference(
                      `notify_${cat.key}` as keyof NotificationPreferences,
                      v
                    )
                  }
                  disabled={saving}
                />
              </div>
              {index < CATEGORIES.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Heures silencieuses
          </CardTitle>
          <CardDescription>
            Désactiver les notifications push pendant certaines plages horaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Début</Label>
              <Input
                id="quiet-start"
                type="time"
                value={prefs.quiet_hours_start?.slice(0, 5) || ''}
                onChange={(e) =>
                  updatePreference('quiet_hours_start', e.target.value || null)
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">Fin</Label>
              <Input
                id="quiet-end"
                type="time"
                value={prefs.quiet_hours_end?.slice(0, 5) || ''}
                onChange={(e) =>
                  updatePreference('quiet_hours_end', e.target.value || null)
                }
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
