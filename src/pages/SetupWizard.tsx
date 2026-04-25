import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowLeft, Loader2, Building2, CreditCard, Banknote, ShieldCheck } from 'lucide-react';

// ─── Step configuration ───────────────────────────────────────────────────────

const SETUP_STEPS = [
  { id: 1, title: 'Entreprise', icon: Building2, description: 'Informations légales' },
  { id: 2, title: 'Banque', icon: Banknote, description: 'Coordonnées bancaires' },
  { id: 3, title: 'Confirmation', icon: ShieldCheck, description: 'Vérification finale' },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

const SetupProgress = ({ current }: { current: number }) => (
  <div className="flex items-center gap-0 justify-center mb-10">
    {SETUP_STEPS.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              current > step.id
                ? 'bg-emerald-500 text-white'
                : current === step.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {current > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
          </div>
          <div className="mt-2 text-center hidden sm:block">
            <p className={`text-xs font-semibold ${current >= step.id ? 'text-emerald-600' : 'text-slate-400'}`}>
              {step.title}
            </p>
            <p className="text-xs text-slate-400 hidden lg:block">{step.description}</p>
          </div>
        </div>
        {i < SETUP_STEPS.length - 1 && (
          <div className={`w-16 sm:w-24 h-0.5 mx-2 transition-all duration-500 ${current > step.id ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        )}
      </div>
    ))}
  </div>
);

// ─── Step 1: Company info ─────────────────────────────────────────────────────

type CompanyInfo = {
  companyName: string;
  rccm: string;
  idNat: string;
  nif: string;
  address: string;
  website: string;
};

const Step1Company = ({ data, onChange, onNext }: {
  data: CompanyInfo;
  onChange: (d: CompanyInfo) => void;
  onNext: () => void;
}) => {
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.companyName || !data.nif) {
      setError('Le nom de l\'entreprise et le NIF sont obligatoires.');
      return;
    }
    setError('');
    onNext();
  };

  const update = (field: keyof CompanyInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Votre entreprise</h2>
        <p className="text-slate-500 text-sm mt-1">Informations légales et coordonnées</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
          Raison sociale / Nom de l'entreprise *
        </Label>
        <Input
          value={data.companyName}
          onChange={update('companyName')}
          placeholder="SARL Pambu & Fils"
          className="border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">NIF *</Label>
          <Input
            value={data.nif}
            onChange={update('nif')}
            placeholder="0XXXXXXXXXX"
            className="border-slate-200 rounded-xl text-sm font-mono"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">RCCM</Label>
          <Input
            value={data.rccm}
            onChange={update('rccm')}
            placeholder="CD/KIN/2024/XXXXX"
            className="border-slate-200 rounded-xl text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">ID/NAT</Label>
        <Input
          value={data.idNat}
          onChange={update('idNat')}
          placeholder="1234567"
          className="border-slate-200 rounded-xl text-sm"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Adresse</Label>
        <Input
          value={data.address}
          onChange={update('address')}
          placeholder="Avenue du Commerce, Kinshasa, RDC"
          className="border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Site web</Label>
        <Input
          value={data.website}
          onChange={update('website')}
          placeholder="https://entreprise.cd"
          className="border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <button
        type="submit"
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
      >
        Continuer
        <i className="ri-arrow-right-line" />
      </button>
    </form>
  );
};

// ─── Step 2: Bank info ─────────────────────────────────────────────────────────

type BankInfo = {
  bankName: string;
  accountNumber: string;
  accountType: string;
  swift: string;
  mobileMoney: string;
};

const Step2Bank = ({ data, onChange, onNext }: {
  data: BankInfo;
  onChange: (d: BankInfo) => void;
  onNext: () => void;
}) => {
  const update = (field: keyof BankInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...data, [field]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Coordonnées bancaires</h2>
        <p className="text-slate-500 text-sm mt-1">Pour recevoir vos paiements</p>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Nom de la banque</Label>
        <Input
          value={data.bankName}
          onChange={update('bankName')}
          placeholder="Rawbank, Equity, TMB..."
          className="border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Type de compte</Label>
        <select
          value={data.accountType}
          onChange={update('accountType')}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none"
        >
          <option value="">Sélectionner</option>
          <option value="courant">Compte courant</option>
          <option value="epargne">Compte épargne</option>
          <option value="devise">Compte en devise (USD)</option>
        </select>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Numéro de compte</Label>
        <Input
          value={data.accountNumber}
          onChange={update('accountNumber')}
          placeholder="0000 0000 0000 0000"
          className="border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Code SWIFT</Label>
        <Input
          value={data.swift}
          onChange={update('swift')}
          placeholder="ABCDRDCXXX"
          className="border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Mobile Money (optionnel)</Label>
        <Input
          value={data.mobileMoney}
          onChange={update('mobileMoney')}
          placeholder="+243 XX XXX XXXX (M-Pesa ou Orange)"
          className="border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
      >
        Continuer
        <i className="ri-arrow-right-line" />
      </button>
    </div>
  );
};

// ─── Step 3: Confirmation ──────────────────────────────────────────────────────

type ReviewData = {
  company: CompanyInfo;
  bank: BankInfo;
};

const Step3Confirm = ({ data, onConfirm, loading }: {
  data: ReviewData;
  onConfirm: () => void;
  loading: boolean;
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Vérification finale</h2>
        <p className="text-slate-500 text-sm mt-1">Confirmez vos informations</p>
      </div>

      {/* Company summary */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Entreprise</p>
        {[
          ['Nom', data.company.companyName],
          ['NIF', data.company.nif],
          ['RCCM', data.company.rccm || '—'],
          ['Adresse', data.company.address || '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Bank summary */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Banque</p>
        {[
          ['Banque', data.bank.bankName],
          ['Compte', data.bank.accountNumber],
          ['Type', data.bank.accountType],
          ['Mobile', data.bank.mobileMoney || '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900">{value}</span>
          </div>
        ))}
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
          Je confirme que les informations ci-dessus sont exactes et j'accepte les{' '}
          <a href="#" className="text-emerald-600 hover:underline">Conditions d'utilisation</a>.
        </span>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!agreed || loading}
        className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Configuration en cours...
          </>
        ) : (
          <>
            <i className="ri-rocket-line" />
            Accéder à FactureX
          </>
        )}
      </button>

      <p className="text-center text-xs text-emerald-600 font-medium">
        🎉 Votre espace est presque prêt !
      </p>
    </div>
  );
};

// ─── Main Setup Wizard ────────────────────────────────────────────────────────

const SetupWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState<CompanyInfo>({
    companyName: '', rccm: '', idNat: '', nif: '', address: '', website: '',
  });
  const [bank, setBank] = useState<BankInfo>({
    bankName: '', accountNumber: '', accountType: '', swift: '', mobileMoney: '',
  });
  const navigate = useNavigate();

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Save company info
      const { error: companyError } = await supabase
        .from('companies')
        .upsert({
          id: user.id,
          name: company.companyName,
          nif: company.nif,
          rccm: company.rccm,
          id_nat: company.idNat,
          address: company.address,
          website: company.website,
          setup_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (companyError) console.error('Company save error:', companyError);

      // Save bank info
      if (bank.bankName || bank.accountNumber) {
        await supabase
          .from('company_banks')
          .upsert({
            company_id: user.id,
            bank_name: bank.bankName,
            account_number: bank.accountNumber,
            account_type: bank.accountType,
            swift: bank.swift,
            mobile_money: bank.mobileMoney,
          }, { onConflict: 'company_id' });
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-file-paper-2-line text-white text-lg" />
            </div>
            <span className="text-slate-900 text-xl font-bold">FactureX</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Configuration initiale</h1>
          <p className="text-slate-500 text-sm mt-1">Finalisez votre espace en 2 minutes</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <SetupProgress current={step} />

          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <Step1Company
              data={company}
              onChange={setCompany}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Step2Bank
              data={bank}
              onChange={setBank}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Step3Confirm
              data={{ company, bank }}
              onConfirm={handleComplete}
              loading={loading}
            />
          )}
        </div>

        {/* Back */}
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}
      </div>

      <style>{`
        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        }
      `}</style>
    </div>
  );
};

export default SetupWizard;
