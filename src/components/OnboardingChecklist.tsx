import React from 'react';
import { CheckCircle2, Circle, ArrowRight, CreditCard, Calendar, UploadCloud, Share2 } from 'lucide-react';
import { User } from '../types/index';

interface OnboardingChecklistProps {
  user: User;
  eventsCount: number;
  photosCount: number;
  onNavigateTab: (tab: string) => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  user,
  eventsCount,
  photosCount,
  onNavigateTab
}) => {
  const isStripeConnected = user.stripeAccountStatus === 'VERIFIED';
  const hasEvents = eventsCount > 0;
  const hasPhotos = photosCount > 0;

  const completedSteps = (isStripeConnected ? 1 : 0) + (hasEvents ? 1 : 0) + (hasPhotos ? 1 : 0);

  if (completedSteps === 3) {
    return null; // Hide onboarding checklist when ready!
  }

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg mb-8 border border-indigo-800/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-indigo-800/40">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Passo a Passo de Configuração
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Sua conta está quase pronta para vender! ({completedSteps}/3 concluídos)
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-indigo-950/80 px-3 py-1.5 rounded-full text-xs text-indigo-200 border border-indigo-800">
          <span>Progresso de Lançamento</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Stripe Connect */}
        <div className={`p-4 rounded-2xl border transition-all ${isStripeConnected ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Passo 1</span>
            {isStripeConnected ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
          </div>
          <h3 className="font-bold text-sm mb-1 text-white flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Conectar Conta Bancária (Stripe)
          </h3>
          <p className="text-xs text-slate-300 mb-3">
            Receba o valor das suas vendas com segurança e repasse automático.
          </p>
          {!isStripeConnected && (
            <button
              onClick={() => onNavigateTab('stripe')}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1"
            >
              Conectar Stripe <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Step 2: Create Event */}
        <div className={`p-4 rounded-2xl border transition-all ${hasEvents ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Passo 2</span>
            {hasEvents ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
          </div>
          <h3 className="font-bold text-sm mb-1 text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Criar seu Primeiro Evento
          </h3>
          <p className="text-xs text-slate-300 mb-3">
            Cadastre um evento (Corrida, Casamento, Futebol) e defina o preço padrão por foto.
          </p>
          {!hasEvents && (
            <button
              onClick={() => onNavigateTab('eventos')}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1"
            >
              Criar evento agora <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Step 3: Upload Photos */}
        <div className={`p-4 rounded-2xl border transition-all ${hasPhotos ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-slate-800/60 border-slate-700/60'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Passo 3</span>
            {hasPhotos ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
          </div>
          <h3 className="font-bold text-sm mb-1 text-white flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            Enviar Fotografias
          </h3>
          <p className="text-xs text-slate-300 mb-3">
            Envie fotos em lote. Marca d'água e miniaturas são aplicadas automaticamente.
          </p>
          {!hasPhotos && (
            <button
              onClick={() => onNavigateTab('eventos')}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1"
            >
              Ir para meus eventos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
