"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  Check,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Crown,
  Star,
  Sparkles,
  Zap,
  Shield,
  Users,
  FileText,
  BarChart3,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// --- Types ---

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_users: number;
  max_factures: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  plan_slug?: string;
  plan_name?: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  auto_renew: boolean;
}

const BILLING_CYCLE = {
  monthly: 'monthly' as const,
  yearly: 'yearly' as const,
};

const PLAN_ICONS: Record<string, any> = {
  free: Star,
  startup: Sparkles,
  pro: Crown,
  enterprise: Zap,
};

export default function SubscriptionPlans() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Upgrade dialog
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [processing, setProcessing] = useState(false);

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

      // Fetch plans
      const { data: plansData, error: plansErr } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (plansErr) throw plansErr;
      setPlans(plansData || []);

      // Fetch subscription
      const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .select('*, plan:plan_id(name, slug)')
        .eq('company_id', profile.company_id)
        .single();

      if (subErr && subErr.code !== 'PGRST116') throw subErr;

      if (subData) {
        setSubscription({
          ...subData,
          plan_name: subData.plan?.name,
          plan_slug: subData.plan?.slug,
        });
      }
    } catch (err: any) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: Plan): number => {
    if (!plan) return 0;
    return billingCycle === 'yearly'
      ? Number(plan.price_yearly) || Number(plan.price_monthly) * 12 * 0.83
      : Number(plan.price_monthly);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !subscription) return;

    try {
      setProcessing(true);
      setError(null);

      // For now: simulate upgrade (Stripe integration later)
      const { error: updateErr } = await supabase
        .from('subscriptions')
        .update({
          plan_id: selectedPlan.id,
          status: 'active',
        })
        .eq('id', subscription.id);

      if (updateErr) throw updateErr;

      setUpgradeDialog(false);
      toast({
        title: `✅ Passage au plan ${selectedPlan.name} effectué !`,
        description: 'Votre abonnement a été mis à jour.',
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      setError(err.message || 'Erreur lors du changement de plan');
    } finally {
      setProcessing(false);
    }
  };

  const getDaysRemaining = (): number => {
    if (!subscription?.current_period_end) return 0;
    const end = new Date(subscription.current_period_end);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const currentPlan = plans.find(p => p.id === subscription?.plan_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Abonnement
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre plan d'abonnement et vos options de facturation
          </p>
        </div>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      {subscription && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-sm px-3 py-1 bg-blue-600">
                    Plan {currentPlan?.name || subscription.plan_name || 'Actuel'}
                  </Badge>
                  <Badge variant={subscription.status === 'active' || subscription.status === 'trial' ? 'default' : 'secondary'}>
                    {subscription.status === 'trial' ? 'Essai gratuit' :
                     subscription.status === 'active' ? 'Actif' :
                     subscription.status === 'canceled' ? 'Annulé' :
                     subscription.status === 'past_due' ? 'En retard' :
                     subscription.status === 'expired' ? 'Expiré' : subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === 'trial' ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Essai gratuit — {getDaysRemaining()} jours restants
                    </span>
                  ) : (
                    <>
                      Prochaine facturation : {subscription.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR')
                        : '—'}
                      {subscription.auto_renew && ' (renouvellement automatique)'}
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <Tabs
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}
        >
          <TabsList>
            <TabsTrigger value="monthly">Mensuel</TabsTrigger>
            <TabsTrigger value="yearly">
              Annuel
              <Badge variant="secondary" className="ml-2 text-xs">-17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => {
          const PlanIcon = PLAN_ICONS[plan.slug] || Star;
          const isCurrent = plan.id === subscription?.plan_id;
          const price = getPrice(plan);
          const userLimit = plan.max_users === -1 ? 'Illimité' : String(plan.max_users);
          const invoiceLimit = plan.max_factures === -1 ? 'Illimité' : `${plan.max_factures}/mois`;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                isCurrent ? 'border-blue-400 ring-2 ring-blue-100' : ''
              } ${plan.slug === 'pro' ? 'scale-105 shadow-lg' : ''}`}
            >
              {plan.slug === 'pro' && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <Star className="h-3 w-3 mr-1" />
                    Recommandé
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <PlanIcon className={`h-5 w-5 ${
                    plan.slug === 'free' ? 'text-gray-400' :
                    plan.slug === 'startup' ? 'text-green-500' :
                    plan.slug === 'pro' ? 'text-blue-500' :
                    'text-purple-500'
                  }`} />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    {price === 0 ? 'Gratuit' : `${formatPrice(price)} $`}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{billingCycle === 'monthly' ? 'mois' : 'an'}
                    </span>
                  )}
                </div>

                <Separator className="mb-4" />

                <ul className="space-y-2">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        plan.slug === 'free' ? 'text-green-400' :
                        plan.slug === 'startup' ? 'text-green-500' :
                        plan.slug === 'pro' ? 'text-blue-500' :
                        'text-purple-500'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{userLimit} utilisateur(s)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{invoiceLimit}</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" variant="outline" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    Plan actuel
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.slug === 'free' ? 'outline' : 'default'}
                    onClick={() => {
                      if (!subscription) return;
                      setSelectedPlan(plan);
                      setUpgradeDialog(true);
                    }}
                    disabled={!subscription}
                  >
                    {plan.price_monthly === 0 ? 'Rester gratuit' : 'Changer pour ce plan'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialog} onOpenChange={setUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer de plan</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <>
                  Passage au plan <strong>{selectedPlan.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nouveau plan :</strong> {selectedPlan.name}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(getPrice(selectedPlan))} $
                  <span className="text-sm font-normal text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'mois' : 'an'}
                  </span>
                </p>
              </div>

              {selectedPlan.price_monthly > 0 && (
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertTitle>Paiement sécurisé</AlertTitle>
                  <AlertDescription>
                    Le paiement sera traité via Stripe. Vous pouvez annuler à tout moment.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Paiement unique (mensuel ou annuel)</p>
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Pas d'engagement — annulation à tout moment</p>
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Prorata pour le mois en cours</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpgrade} disabled={processing}>
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {selectedPlan?.price_monthly === 0 ? 'Confirmer' : `Payer ${formatPrice(getPrice(selectedPlan!))} $`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
