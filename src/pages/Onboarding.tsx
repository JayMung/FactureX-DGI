import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// ─── Slide data ──────────────────────────────────────────────────────────────

const slides = [
  {
    id: 1,
    badge: 'Étape 1',
    title: 'Bienvenue sur FactureX',
    subtitle: 'La facturation électronique en conformité DGI',
    description:
      'La solution de facturation électronique qui simplifie votre quotidien et vous met en conformité avec la réglementation DGI.',
    features: [
      { title: 'Créer des factures en 30 secondes', subtitle: 'Modèle intelligent avec calcul TVA automatique' },
      { title: 'Transmission automatique à la DGI', subtitle: 'Validation en temps réel via notre API' },
      { title: 'QR Code sur chaque facture', subtitle: 'Authenticité et traçabilité garanties' },
    ],
    icon: 'ri-file-paper-2-line',
    pills: [
      { icon: 'ri-shield-check-line', color: 'text-emerald-300', label: 'Conforme DGI' },
      { icon: 'ri-qr-code-line', color: 'text-yellow-300', label: 'QR Code intégré' },
      { icon: 'ri-lightning-line', color: 'text-orange-300', label: 'Temps réel' },
    ],
  },
  {
    id: 2,
    badge: 'Étape 2',
    title: 'Gérez vos clients et catalogue',
    subtitle: 'Un repertoire complet pour votre activité',
    description:
      'Centralisez toutes vos informations clients et produits. Plus jamais de données perdues ou de prix incorrects.',
    features: [
      { title: 'Repertoire clients结构和', subtitle: 'Historique complet, coordonnées, TVA' },
      { title: 'Catalogue produits intelligent', subtitle: 'Stock, prix HT/TTC, catégories' },
      { title: 'Devis et bons de commande', subtitle: 'Conversion en facture en 1 clic' },
    ],
    icon: 'ri-user-star-line',
    pills: [
      { icon: 'ri-group-line', color: 'text-blue-300', label: 'Clients' },
      { icon: 'ri-archive-line', color: 'text-purple-300', label: 'Catalogue' },
      { icon: 'ri-file-list-3-line', color: 'text-teal-300', label: 'Devis' },
    ],
  },
  {
    id: 3,
    badge: 'Étape 3',
    title: 'Caisse POS intégrée',
    subtitle: 'Encaissements rapides et sécurisé',
    description:
      'Votre caisse est syncronisée avec votre comptabilité. Finis les tableaux Excel et les erreurs de calcul.',
    features: [
      { title: 'Paiement mobile (M-Pesa, Orange, Airtel)', subtitle: 'Sans frais, instantané' },
      { title: 'Gestion de la petite caisse', subtitle: 'Ouverture, mouvements, clôture' },
      { title: 'Tickets et reçus automatiques', subtitle: 'Impression ou envoi par email/SMS' },
    ],
    icon: 'ri-wallet-3-line',
    pills: [
      { icon: 'ri-mobile-line', color: 'text-green-300', label: 'Mobile Money' },
      { icon: 'ri-bank-card-line', color: 'text-pink-300', label: 'Cash & Card' },
      { icon: 'ri-receipt-line', color: 'text-amber-300', label: 'Reçus' },
    ],
  },
  {
    id: 4,
    badge: 'Étape 4',
    title: 'Comptabilité OHADA simplifiée',
    subtitle: 'Votre bilan et grand livre en un clin d\'oeil',
    description:
      'Generer vos etats financiers conformes auSYSCOHADA en un clic. Plus besoin d\'etre comptable pour tenir vos comptes.',
    features: [
      { title: 'Plan comptable SYSCOHADA', subtitle: 'Automatisé, toujours à jour' },
      { title: 'Journal et grand livre', subtitle: 'Ecritures automatiques' },
      { title: 'Bilan et compte de résultat', subtitle: 'Export PDF/XML officiel' },
    ],
    icon: 'ri-bar-chart-box-line',
    pills: [
      { icon: 'ri-book-2-line', color: 'text-indigo-300', label: 'SYSCOHADA' },
      { icon: 'ri-file-chart-line', color: 'text-rose-300', label: 'Bilan' },
      { icon: 'ri-download-line', color: 'text-cyan-300', label: 'Export' },
    ],
  },
];

// ─── Individual slide ─────────────────────────────────────────────────────────

const Slide = ({
  slide,
  onNext,
  onPrev,
  isLast,
  currentSlide,
  totalSlides,
}: {
  slide: (typeof slides)[0];
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
  currentSlide: number;
  totalSlides: number;
}) => (
  <div className="flex flex-col lg:flex-row min-h-[600px]">
    {/* Left hero */}
    <div className="hidden lg:flex lg:w-1/2 gradient-onboard relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="blob bg-emerald-300 w-72 h-72 rounded-full -top-20 -left-20 mix-blend-multiply" />
      <div className="blob bg-teal-200 w-72 h-72 rounded-full bottom-0 right-0 mix-blend-multiply" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center shadow-2xl">
          <i className={`${slide.icon} text-white text-5xl`} />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-white">{slide.title}</h2>
          <p className="text-emerald-100 text-lg max-w-md mx-auto leading-relaxed">
            {slide.description}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {slide.pills.map((pill, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-white text-sm"
            >
              <i className={`${pill.icon} ${pill.color}`} />
              {pill.label}
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'bg-white w-6' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Right panel */}
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        {/* Mobile badge */}
        <div className="lg:hidden text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <i className={`${slide.icon} text-emerald-600 text-3xl`} />
          </div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            {slide.badge}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{slide.title}</h1>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2">
          <div
            className="h-1 flex-1 rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
          <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest hidden lg:block">
            {slide.badge}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 hidden lg:block">{slide.title}</h1>
          <p className="text-slate-500 leading-relaxed hidden lg:block">{slide.description}</p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {slide.features.map((feat, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="ri-check-line text-emerald-600 text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{feat.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{feat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {currentSlide > 0 ? (
            <button
              onClick={onPrev}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
            >
              <i className="ri-arrow-left-line" />
              Retour
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              onClick={onNext}
              className="flex-1 btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <i className="ri-rocket-line" />
              Commencer
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 btn-primary text-white font-semibold py-3 rounded-xl text-sm shadow-lg shadow-green-700/25 hover:shadow-xl hover:shadow-green-700/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Suivant
              <i className="ri-arrow-right-line" />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          {isLast ? 'Prêt à démarrer votre activité sur FactureX' : `Étape ${currentSlide + 1} sur ${totalSlides}`}
        </p>
      </div>
    </div>
  </div>
);

// ─── Onboarding Carousel ──────────────────────────────────────────────────────

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      navigate('/setup');
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen">
      <Slide
        key={currentSlide}
        slide={slides[currentSlide]}
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onNext={handleNext}
        onPrev={handlePrev}
        isLast={currentSlide === slides.length - 1}
      />

      <style>{`
        .gradient-onboard {
          background: linear-gradient(145deg, #059669 0%, #10b981 50%, #059669 100%);
        }
        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        }
        .slide-up {
          animation: slide-up 0.4s ease-out both;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .blob {
          position: absolute;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.4;
          animation: move 10s infinite alternate;
        }
        @keyframes move {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(20px, -20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
