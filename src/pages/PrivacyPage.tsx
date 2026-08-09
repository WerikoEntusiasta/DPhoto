import React from 'react';
import { APP_CONFIG } from '../config/index';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-slate-800 text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-slate-900">Política de Privacidade (LGPD)</h1>
        <p className="text-slate-500 text-xs">Conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Coleta Mínima de Dados</h2>
          <p>
            O {APP_CONFIG.appName} coleta apenas os dados estritamente necessários para a conclusão das transações comerciais (Nome, E-mail, WhatsApp e dados de cobrança via Stripe).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Não Armazenamento de Dados de Cartão</h2>
          <p>
            Dados sensíveis de cartão de crédito e senhas financeiras são processados diretamente em ambiente seguro homologado pela Stripe, sem trafegar ou serem armazenados em nossos servidores.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Direitos do Titular de Dados</h2>
          <p>
            Em cumprimento à LGPD, o usuário pode solicitar a confirmação da existência de tratamento, o acesso, a correção ou a exclusão definitiva de seus dados cadastrais a qualquer momento através do suporte da plataforma.
          </p>
        </section>
      </div>
    </div>
  );
};
