import React from 'react';
import { APP_CONFIG } from '../config/index';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-slate-800 text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-slate-900">Termos de Uso do {APP_CONFIG.appName}</h1>
        <p className="text-slate-500 text-xs">Última atualização: 8 de Agosto de 2026</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Aceite dos Termos</h2>
          <p>
            Ao utilizar a plataforma {APP_CONFIG.appName}, o fotógrafo e o comprador concordam com as regras aqui estipuladas para publicação e venda de imagens de eventos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Direitos Autorais e Responsabilidade das Fotos</h2>
          <p>
            O fotógrafo declara sob as penas da lei que possui a titularidade patrimonial ou autorização legal necessária para capturar, disponibilizar e comercializar as imagens enviadas para a plataforma.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Comissões e Planos</h2>
          <p>
            O serviço opera mediante assinatura no Plano Profissional (R$ 97,90/mês, exclusivamente mensal, sem contrato de fidelidade) acrescido de 5% de comissão de intermediação retida pela plataforma sobre cada foto vendida. O fotógrafo é responsável adicionalmente pelas taxas de processamento da instituição de pagamentos (Stripe).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">4. Entrega de Conteúdo Digital</h2>
          <p>
            Após a confirmação do pagamento, os arquivos digitais em alta resolução sem marca d'água são liberados para download imediato na página do pedido.
          </p>
        </section>
      </div>
    </div>
  );
};
