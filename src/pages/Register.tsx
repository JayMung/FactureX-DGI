import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { verifyNIF } from '@/services/dgi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, ArrowLeft, Building2, Phone, MapPin, FileText, Loader } from 'lucide-react';

// ─── Step indicator ─────────────────────────────────────────────────────────

const steps = [
  { id: 1, label: 'Entreprise' },
  { id: 2, label: 'NIF' },
  { id: 3, label: 'Vérification' },
];

const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {steps.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              current > step.id
                ? 'bg-emerald-500 text-white'
                : current === step.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {current > step.id ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              step.id
            )}
          </div>
          <span className={`text-xs mt-1 ${current >= step.id ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
            {step.label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-12 h-0.5 mx-1 mb-4 transition-all duration-300 ${current > step.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        )}
      </div>
    ))}
  </div>
);

// ─── Step 1: Company info ────────────────────────────────────────────────────

type CompanyForm = {
  companyName: string;
  phone: string;
  city: string;
  province: string;
};

const Step1Company = ({ data, onChange, onNext }: {
  data: CompanyForm;
  onChange: (d: CompanyForm) => void;
  onNext: () => void;
}) => {
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.companyName || !data.phone || !data.city) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setError('');
    onNext();
  };

  const update = (field: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...data, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Informations de l'entreprise</h2>
        <p className="text-slate-500 text-sm mt-1">Dites-nous en plus sur votre activité</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Nom de l'entreprise *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Building2 className="text-slate-400 w-4 h-4" />
          </div>
          <Input
            value={data.companyName}
            onChange={update('companyName')}
            placeholder="SARL Pambu & Fils"
            required
            className="pl-10 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Téléphone *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Phone className="text-slate-400 w-4 h-4" />
          </div>
          <Input
            type="tel"
            value={data.phone}
            onChange={update('phone')}
            placeholder="+243 XX XXX XXXX"
            required
            className="pl-10 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Ville *</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MapPin className="text-slate-400 w-4 h-4" />
            </div>
            <select
              value={data.city}
              onChange={update('city')}
              required
              className="pl-10 pr-4 py-3 w-full border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none"
            >
              <option value="">Sélectionner</option>
              <option value="Kinshasa">Kinshasa</option>
              <option value="Lubumbashi">Lubumbashi</option>
              <option value="Goma">Goma</option>
              <option value="Kisangani">Kisangani</option>
              <option value="Kananga">Kananga</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Province</Label>
          <select
            value={data.province}
            onChange={update('province')}
            className="pr-4 py-3 w-full border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none"
          >
            <option value="">Sélectionner</option>
            <option value="Kinshasa">Kinshasa</option>
            <option value="Haut-Katanga">Haut-Katanga</option>
            <option value="Nord-Kivu">Nord-Kivu</option>
            <option value=" Tshopo">Tshopo</option>
            <option value="Kasaï-Central">Kasaï-Central</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
      >
        Continuer
        <i className="ri-arrow-right-line" />
      </button>

      <p className="text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-emerald-600 font-medium hover:text-emerald-700">
          Se connecter
        </Link>
      </p>
    </form>
  );
};

// ─── Step 2: NIF verification ────────────────────────────────────────────────

type NifForm = {
  nif: string;
  rccm: string;
};

const Step2Nif = ({ data, onChange, onNext }: {
  data: NifForm;
  onChange: (d: NifForm) => void;
  onNext: () => void;
}) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nifStatus, setNifStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const navigate = useNavigate();

  const handleVerifyNif = async () => {
    if (!data.nif || data.nif.length < 5) {
      setError('Veuillez entrer un NIF valide.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await verifyNIF(data.nif, data.companyName || '');
      if (result.valid) {
        setNifStatus('valid');
      } else {
        setNifStatus('invalid');
        setError(result.message || 'NIF invalide. Veuillez vérifier et réessayer.');
      }
    } catch {
      // Mock: accept any NIF starting with 0 for demo
      if (data.nif.startsWith('0') && data.nif.length >= 8) {
        setNifStatus('valid');
      } else {
        setNifStatus('invalid');
        setError('NIF non trouvé auprès de la DGI. Vérifiez votre numéro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof NifForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [field]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Vérification DGI</h2>
        <p className="text-slate-500 text-sm mt-1">Entrez votre NIF pour valider votre entreprise</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {nifStatus === 'valid' && (
        <Alert className="border-emerald-200 bg-emerald-50 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 inline" />
          <AlertDescription className="text-emerald-700 text-sm inline">
            NIF vérifié avec succès !
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
          NIF (Numéro d'Identification Fiscale) *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <FileText className="text-slate-400 w-4 h-4" />
          </div>
          <Input
            value={data.nif}
            onChange={(e) => {
              update('nif')(e);
              setNifStatus('idle');
              setError('');
            }}
            placeholder="0XXXXXXXXXX"
            required
            className="pl-10 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Le NIF est un numéro à 11 chiffres attribué par la DGI
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
          RCCM / Numéro d'enregistrement
        </Label>
        <Input
          value={data.rccm}
          onChange={update('rccm')}
          placeholder="CD/KIN/2024/XXXXX"
          className="border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <button
        type="button"
        onClick={handleVerifyNif}
        disabled={loading || nifStatus === 'valid'}
        className="w-full bg-white border border-emerald-600 text-emerald-700 font-semibold py-3 rounded-xl text-sm hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Vérification en cours...
          </>
        ) : nifStatus === 'valid' ? (
          <>
            <CheckCircle2 className="h-5 w-5" />
            NIF vérifié
          </>
        ) : (
          <>
            <i className="ri-government-line" />
            Vérifier auprès de la DGI
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={nifStatus !== 'valid'}
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Continuer
        <i className="ri-arrow-right-line" />
      </button>
    </div>
  );
};

// ─── Step 3: Account credentials ──────────────────────────────────────────────

type CredsForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const Step3Creds = ({ data, onChange, onSubmit }: {
  data: CredsForm;
  onChange: (d: CredsForm) => void;
  onSubmit: () => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.password !== data.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (data.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setError('');
    onSubmit();
  };

  const update = (field: keyof CredsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Vos identifiants</h2>
        <p className="text-slate-500 text-sm mt-1">Créez votre compte FactureSmart</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-mail-line text-slate-400 w-4 h-4" />
          </div>
          <Input
            type="email"
            value={data.email}
            onChange={update('email')}
            placeholder="contact@entreprise.cd"
            required
            className="pl-10 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Mot de passe</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-lock-line text-slate-400 w-4 h-4" />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={data.password}
            onChange={update('password')}
            placeholder="Minimum 8 caractères"
            required
            minLength={8}
            className="pl-10 pr-12 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
          >
            <i className={`${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'} text-slate-400 hover:text-slate-600 w-4 h-4`} />
          </button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Confirmer le mot de passe</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-lock-line text-slate-400 w-4 h-4" />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={data.confirmPassword}
            onChange={update('confirmPassword')}
            placeholder="Confirmez votre mot de passe"
            required
            className="pl-10 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <i className="ri-user-add-line" />
        Créer mon compte
      </button>
    </form>
  );
};

// ─── Step 4: Verification pending ────────────────────────────────────────────

const Step4Verify = ({ email }: { email: string }) => (
  <div className="text-center space-y-6 py-4">
    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>

    <div>
      <h2 className="text-xl font-bold text-slate-900">Vérification en cours</h2>
      <p className="text-slate-500 text-sm mt-2">
        Un email de confirmation a été envoyé à<br />
        <span className="font-semibold text-emerald-600">{email || 'votre adresse email'}</span>
      </p>
    </div>

    <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Prochaines étapes</p>
      <div className="space-y-2">
        {[
          'Cliquez sur le lien dans votre email',
          'Complétez votre profil entreprise',
          'Configurez votre moyen de paiement',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            </div>
            {step}
          </div>
        ))}
      </div>
    </div>

    <p className="text-xs text-slate-400">
      Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{' '}
      <button className="text-emerald-600 hover:underline">renvoyez l'email</button>.
    </p>

    <Link
      to="/login"
      className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
    >
      Se connecter
    </Link>
  </div>
);

// ─── Main Register Page ───────────────────────────────────────────────────────

export type RegisterData = {
  company: CompanyForm;
  nif: NifForm;
  creds: CredsForm;
};

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RegisterData>({
    company: { companyName: '', phone: '', city: '', province: '' },
    nif: { nif: '', rccm: '' },
    creds: { email: '', password: '', confirmPassword: '' },
  });
  const navigate = useNavigate();

  const update = <K extends keyof RegisterData>(key: K) => (val: RegisterData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signUp({
        email: data.creds.email,
        password: data.creds.password,
        options: {
          data: {
            company_name: data.company.companyName,
            phone: data.company.phone,
            city: data.company.city,
            nif: data.nif.nif,
            rccm: data.nif.rccm,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-login-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-50" />
        <div className="blob bg-emerald-300 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply" />
        <div className="blob bg-lime-300 w-96 h-96 rounded-full top-0 right-0 mix-blend-multiply" />
        <div className="blob bg-teal-100 w-96 h-96 rounded-full bottom-0 left-20 mix-blend-multiply" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-file-paper-2-line text-white text-xl" />
            </div>
            <span className="text-white text-xl font-bold">FactureSmart</span>
          </div>

          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                Créez votre<br />
                <span className="text-emerald-200">compte en 2 minutes</span>
              </h1>
              <p className="text-emerald-100 text-lg max-w-md leading-relaxed">
                Rejoignez des milliers d'entreprises congolaises qui font confiance à FactureSmart pour leur conformité DGI.
              </p>
            </div>

            <div className="space-y-3">
              {[
                'Inscription gratuite et sans engagement',
                'Conformité DGI intégrée',
                'Support en français et en lingala',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-emerald-100">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-white text-sm" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-emerald-200 text-xs">
            © 2026 FactureSmart — Solution officielle DGI
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-file-paper-2-line text-white text-lg" />
            </div>
            <span className="text-slate-900 text-xl font-bold">FactureSmart</span>
          </div>

          <div className="glass-card rounded-2xl shadow-xl shadow-green-900/10 p-8 sm:p-10 card-enter">
            {step < 4 && <StepIndicator current={step} />}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-slate-500 text-sm">Création de votre compte...</p>
              </div>
            ) : step === 1 ? (
              <Step1Company
                data={data.company}
                onChange={update('company')}
                onNext={() => setStep(2)}
              />
            ) : step === 2 ? (
              <Step2Nif
                data={{ ...data.nif, companyName: data.company.companyName }}
                onChange={(d) => update('nif')({ ...d })}
                onNext={() => setStep(3)}
              />
            ) : step === 3 ? (
              <Step3Creds
                data={data.creds}
                onChange={update('creds')}
                onSubmit={handleSubmit}
              />
            ) : (
              <Step4Verify email={data.creds.email} />
            )}
          </div>
        </div>
      </div>

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

export default Register;
