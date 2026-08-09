import React from 'react';
import { Camera, CheckCircle2, ArrowRight, Zap, ShieldCheck, Sparkles, CreditCard, Share2, UploadCloud, Smartphone } from 'lucide-react';
import { APP_CONFIG } from '../config/index';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-50 text-slate-900 font-sans min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma SaaS para Fotógrafos Independentes
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6">
            Venda suas fotos. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
              Simples assim.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Crie seu evento, compartilhe o link direto no WhatsApp e deixe seus clientes escolherem e comprarem fotos digitais em alta resolução.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Começar grátis
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('demo_gallery')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              Ver como funciona
            </button>
          </div>

          {/* Key Value Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left pt-6 border-t border-slate-200/80 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-5 credit-card" />
              <span>Checkout sem senha pro cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Receba via Stripe Connect</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Marca d'água automática</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Downloads em alta resolução</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Simplicidade Extrema</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Como funciona em 4 passos simples</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mb-5">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Crie seu evento</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cadastre o nome do evento (Corrida, Futebol, Casamento, Aniversário) e defina o preço padrão por foto.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mb-5">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Suba suas fotos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Faça upload em lote de centenas de fotos. O sistema gera automaticamente thumbnails e previews protegidos com marca d'água.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mb-5">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Compartilhe o link</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Envie a galeria pública para os clientes via WhatsApp, Instagram ou QR Code. O cliente não precisa criar senha para comprar!
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mb-5">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Receba pelas vendas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                O pagamento é processado pela Stripe e o cliente recebe imediatamente o acesso aos arquivos originais em alta resolução.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Transparência Total</h2>
            <p className="text-3xl font-extrabold tracking-tight">Escolha o plano ideal para seu momento</p>
          </div>

        {/* PRICING SECTION */}
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-b from-indigo-900/90 to-slate-900 border-2 border-indigo-500 p-8 sm:p-10 rounded-3xl flex flex-col justify-between relative shadow-2xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-black uppercase rounded-full tracking-wider flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Assinatura Profissional
            </div>

            <div>
              <div className="text-center border-b border-indigo-800/60 pb-6 mt-2">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
                  Cobrança exclusivamente mensal
                </span>
                <h3 className="text-2xl font-bold">Plano Fotógrafo Pro</h3>
                <div className="text-5xl font-black my-3 text-white">
                  R$ 97,90 <span className="text-base font-normal text-slate-300">/mês</span>
                </div>
                <p className="text-sm text-indigo-200">
                  + 5% de comissão por venda de foto no checkout
                </p>
              </div>

              <ul className="space-y-3.5 text-sm text-slate-200 my-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Sem contrato de fidelidade</strong> (cancele a qualquer momento)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>5% de comissão</strong> da plataforma sobre vendas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eventos, álbuns e fotos ilimitados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Marca d'água automática para proteção de autoria</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Repasses automáticos via Stripe Connect</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('register')}
              className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-base shadow-lg transition-all text-center flex items-center justify-center gap-2"
            >
              Criar Conta e Assinar (R$ 97,90/mês)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-indigo-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Pronto para transformar suas fotos em vendas?
          </h2>
          <p className="text-indigo-100 text-base mb-8 max-w-xl mx-auto">
            Cadastre-se em 1 minuto, crie seu primeiro evento e comece a enviar o link pelas suas redes sociais hoje mesmo.
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="px-8 py-4 rounded-xl bg-white text-indigo-700 font-extrabold text-base shadow-lg hover:bg-indigo-50 transition-all inline-flex items-center gap-2"
          >
            Começar agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};
