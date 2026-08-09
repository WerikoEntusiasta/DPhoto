import React from 'react';
import { CheckCircle, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../config/index';

interface PricingPageProps {
  onNavigate: (view: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Assinatura simples e sem fidelidade
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Apenas R$ 97,90 por mês mais 5% de comissão sobre suas vendas de fotos. Sem contratos longos ou multas de cancelamento.
          </p>
        </div>

        {/* PRICING CARD */}
        <div className="max-w-xl mx-auto mb-20">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border-2 border-indigo-500 relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-black uppercase rounded-full tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Plano Único Profissional
            </div>

            <div>
              <div className="text-center border-b border-slate-800 pb-8 mt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Assinatura Mensal</div>
                <div className="text-5xl font-black text-white mb-2">
                  R$ 97,90 <span className="text-base font-normal text-slate-400">/mês</span>
                </div>
                <p className="text-sm text-slate-300">
                  + 5% de comissão por venda de foto no checkout
                </p>
              </div>

              <div className="space-y-4 py-8 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Cobrança Mensal</strong> (cancele a qualquer momento sem taxas)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>5% de comissão</strong> da plataforma sobre cada foto vendida</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Eventos e Fotos Ilimitadas</strong> na galeria do fotógrafo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Marca d'água automática</strong> de proteção com seu nome</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Repasses Automáticos</strong> via Stripe Connect diretamente na sua conta</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span><strong>Suporte Prioritário</strong> e métricas completas de vendas</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('register')}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              Começar Agora (R$ 97,90/mês)
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FINANCIAL CALCULATION SIMULATOR EXAMPLE */}
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <h3 className="text-xl font-bold text-slate-900 mb-2 text-center sm:text-left">
            Simulador de Repasse (Venda de R$ 100,00 em fotos)
          </h3>
          <p className="text-sm text-slate-600 mb-6 text-center sm:text-left">
            Veja exatamente como é calculado o valor líquido transferido para sua conta bancária:
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm space-y-3">
            <div className="flex justify-between items-center text-slate-800">
              <span>Valor pago pelo cliente:</span>
              <span className="font-bold text-slate-900 text-base">R$ 100,00</span>
            </div>
            <div className="flex justify-between items-center text-rose-600">
              <span>Comissão da Plataforma (5%):</span>
              <span className="font-semibold">- R$ 5,00</span>
            </div>
            <div className="flex justify-between items-center text-amber-600">
              <span>Taxa Est. do Meio de Pagamento (Stripe ~3,99% + R$0,39):</span>
              <span className="font-semibold">- R$ 4,38</span>
            </div>
            <div className="pt-3 border-t border-slate-300 flex justify-between items-center font-black text-emerald-700 text-lg">
              <span>Você Recebe na Conta:</span>
              <span>R$ 90,62</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
