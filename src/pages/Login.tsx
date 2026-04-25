import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { serverRateLimiter, getClientIdentifier, formatResetTime } from '@/lib/rate-limit-server';
import {
  logLoginSuccess,
  logLoginFailed,
  logRateLimitExceeded
} from '@/services/securityLogger';
import { sessionManager, useSessionSecurity } from '@/lib/security/session-management';
import { GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID } from '@/lib/constants';
import { initiateOAuthMock, isOAuthConfigured } from '@/services/mockOAuth';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components for the hero panel (shared between login/register)
// ─────────────────────────────────────────────────────────────────────────────

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-3 text-emerald-100">
    <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
      <i className={`${icon} text-white text-sm`} />
    </div>
    <span className="text-sm font-medium">{text}</span>
  </div>
);

const LeftHeroPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 gradient-login-hero relative overflow-hidden">
    {/* Background dots */}
    <div className="absolute inset-0 bg-dots opacity-50" />

    {/* Organic blobs */}
    <div className="blob bg-emerald-300 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply" />
    <div className="blob bg-lime-300 w-96 h-96 rounded-full top-0 right-0 mix-blend-multiply" />
    <div className="blob bg-teal-100 w-96 h-96 rounded-full bottom-0 left-20 mix-blend-multiply" />

    {/* DRC watermark */}
    <svg className="absolute right-8 bottom-8 opacity-[0.04]" width="180" height="120" viewBox="0 0 180 120" fill="none">
      <rect width="180" height="120" rx="8" fill="white"/>
      <rect width="60" height="40" fill="#2E9PSA"/>
      <rect y="40" width="60" height="40" fill="#FFD100"/>
      <rect y="80" width="60" height="40" fill="#2E9PSA"/>
      <rect x="60" width="60" height="120" fill="#2E9PSA"/>
      <circle cx="90" cy="60" r="20" fill="none" stroke="#FFD100" strokeWidth="3"/>
      <circle cx="90" cy="60" r="12" fill="#FFD100"/>
    </svg>

    <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
          <i className="ri-file-paper-2-line text-white text-xl" />
        </div>
        <div>
          <span className="text-white text-xl font-bold tracking-tight">FactureX</span>
          <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-white/20 text-white rounded-full border border-white/30">RDC</span>
        </div>
      </div>

      {/* Hero content */}
      <div className="space-y-8">
        <div className="space-y-5">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
            La facturation<br />
            <span className="text-emerald-200">en toute conformité</span>
          </h1>
          <p className="text-emerald-100 text-lg max-w-md leading-relaxed">
            Gérez vos factures électroniques, transmettez-les à la DGI et suivez votre activité fiscale en toute simplicité.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          <FeatureItem icon="ri-shield-check-line" text="Conforme à la réglementation DGI / RDC" />
          <FeatureItem icon="ri-qr-code-line" text="QR Code et signature numérique sur chaque facture" />
          <FeatureItem icon="ri-global-line" text="Transmission en temps réel à la DGI" />
          <FeatureItem icon="ri-bar-chart-box-line" text="Tableaux de bord et rapports fiscaux" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-emerald-200 text-xs">
        <span>© 2026 FactureX — Solution officielle DGI</span>
        <span className="flex items-center gap-1">
          <i className="ri-shield-fill text-xs" />
          Certifié DGI
        </span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Login Form
// ─────────────────────────────────────────────────────────────────────────────

const LoginForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useSessionSecurity({
    enableTimeout: true,
    enableConcurrentLimit: true,
    enableRegeneration: true,
    customTimeout: 15 * 60 * 1000,
    maxSessions: 3
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const identifier = getClientIdentifier();
      const rateLimitResult = await serverRateLimiter.check('login', identifier);

      if (!rateLimitResult.success) {
        const resetTime = formatResetTime(rateLimitResult.reset);
        await logRateLimitExceeded('login', rateLimitResult.remaining);
        throw new Error(`Trop de tentatives de connexion. Veuillez réessayer dans ${resetTime}.`);
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        await logLoginFailed(email, error.message);
        throw new Error(error.message || 'Email ou mot de passe incorrect');
      }

      if (data.session && data.user) {
        const canCreateSession = await sessionManager.checkConcurrentSessions(data.user.id);
        if (!canCreateSession) {
          await supabase.auth.signOut();
          throw new Error('Nombre maximum de sessions simultanées atteint.');
        }
        sessionManager.createSession(data.session, data.user);
        await sessionManager.regenerateSession();
        await logLoginSuccess(email);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    // Use mock OAuth if real credentials not configured
    if (!GOOGLE_CLIENT_ID && !MICROSOFT_CLIENT_ID) {
      try {
        setError('');
        const user = await initiateOAuthMock(provider);
        // In mock mode, sign in with the mock email
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: '__mock_oauth__',
        });
        if (error) {
          // Mock user doesn't exist in Supabase yet — create them
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: user.email,
            password: '__mock_oauth__',
            options: {
              data: { full_name: user.name, avatar_url: user.picture },
            },
          });
          if (signUpError) throw signUpError;
          if (data.session) {
            await sessionManager.createSession(data.session, data.user!);
            await sessionManager.regenerateSession();
            await logLoginSuccess(user.email);
            navigate('/');
          }
        } else if (data.session) {
          await sessionManager.createSession(data.session, data.user);
          await sessionManager.regenerateSession();
          await logLoginSuccess(user.email);
          navigate('/');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur OAuth mock');
      }
      return;
    }

    // Real OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setError(error.message);
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Bienvenue</h2>
        <p className="text-slate-500 text-sm mt-1">Connectez-vous à votre espace</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Email ou NIF</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-user-line text-slate-400 text-base" />
          </div>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="pl-10 pr-4 py-3 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Mot de passe</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-lock-line text-slate-400 text-base" />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="pl-10 pr-12 py-3 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
          >
            <i className={`${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'} text-slate-400 hover:text-slate-600 text-base`} />
          </button>
        </div>
      </div>

      {/* Remember me + forgot */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span className="text-xs text-slate-500">Se souvenir de moi</span>
        </label>
        <Link
          to="/reset-password"
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <i className="ri-login-box-line" />}
        Se connecter
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">ou</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* OAuth buttons */}
      {GOOGLE_CLIENT_ID && (
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Connexion avec Google
        </button>
      )}

      {MICROSOFT_CLIENT_ID && (
        <button
          type="button"
          onClick={() => handleOAuthLogin('microsoft')}
          className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z"/>
            <path fill="#00A4EF" d="M1 13h10v10H1z"/>
            <path fill="#7FBA00" d="M13 1h10v10H13z"/>
            <path fill="#FFB900" d="M13 13h10v10H13z"/>
          </svg>
          Connexion avec Microsoft
        </button>
      )}

      {/* Switch to register */}
      <p className="text-center text-sm text-slate-500">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-emerald-600 font-medium hover:text-emerald-700">
          Créer un compte
        </button>
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Register Form
// ─────────────────────────────────────────────────────────────────────────────

const RegisterForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!agreed) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Créer un compte</h2>
        <p className="text-slate-500 text-sm mt-1">Commencez en 2 minutes</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-mail-line text-slate-400 text-base" />
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@entreprise.cd"
            required
            className="pl-10 pr-4 py-3 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Mot de passe</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-lock-line text-slate-400 text-base" />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            required
            minLength={8}
            className="pl-10 pr-12 py-3 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
          >
            <i className={`${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'} text-slate-400 hover:text-slate-600 text-base`} />
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Confirmer le mot de passe</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-lock-line text-slate-400 text-base" />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez votre mot de passe"
            required
            className="pl-10 pr-4 py-3 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
        />
        <span className="text-xs text-slate-500">
          J'accepte les{' '}
          <a href="#" className="text-emerald-600 hover:underline">Conditions d'utilisation</a>{' '}
          et la{' '}
          <a href="#" className="text-emerald-600 hover:underline">Politique de confidentialité</a>
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <i className="ri-user-add-line" />}
        Créer mon compte
      </button>

      <p className="text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-emerald-600 font-medium hover:text-emerald-700">
          Se connecter
        </button>
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Login Page
// ─────────────────────────────────────────────────────────────────────────────

type AuthTab = 'login' | 'register';

const Login = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Panel */}
      <LeftHeroPanel />

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-file-paper-2-line text-white text-lg" />
            </div>
            <span className="text-slate-900 text-xl font-bold">FactureX</span>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl shadow-xl shadow-green-900/10 p-8 sm:p-10 card-enter">

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                S'inscrire
              </button>
            </div>

            {/* Forms */}
            {activeTab === 'login' ? (
              <LoginForm onSwitch={() => setActiveTab('register')} />
            ) : (
              <RegisterForm onSwitch={() => setActiveTab('login')} />
            )}
          </div>
        </div>
      </div>

      {/* Inline styles for animation and gradients */}
      <style>{`
        .bg-dots { background-image: radial-gradient(circle, rgba(5,150,105,0.07) 1.5px, transparent 1.5px); background-size: 24px 24px; }
        .gradient-login-hero { background: linear-gradient(145deg, #059669 0%, #10b981 40%, #059669 100%); }
        .glass-card { backdrop-filter: blur(16px); background: rgba(255,255,255,0.92); border: 1px solid rgba(5,150,105,0.12); }
        .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .btn-primary:hover { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
        .card-enter { animation: card-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes card-enter { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .blob { position: absolute; filter: blur(80px); z-index: -1; opacity: 0.4; animation: move 10s infinite alternate; }
        @keyframes move { from { transform: translate(0, 0) scale(1); } to { transform: translate(20px, -20px) scale(1.1); } }
      `}</style>
    </div>
  );
};

export default Login;
