import React from 'react';
import { Camera } from 'lucide-react';
import { APP_CONFIG } from '../config/index';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold font-sans tracking-tight">
              {APP_CONFIG.appName}
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Plataforma SaaS simples e rápida para fotógrafos venderem fotos de eventos online com Stripe Connect, álbuns e repasses automáticos.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Plataforma</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                Como Funciona
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">
                Planos & Preços
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('demo_gallery')} className="hover:text-white transition-colors">
                Galeria Exemplo
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Para Fotógrafos</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('register')} className="hover:text-white transition-colors">
                Criar Conta Grátis
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors">
                Acessar Painel
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">
                Assinar Plano PRO (0% Taxa)
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Legal & Privacidade</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">
                Termos de Uso
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">
                Política de Privacidade (LGPD)
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800 text-xs text-center text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© 2026 {APP_CONFIG.appName} SaaS. Todos os direitos reservados.</p>
        <p className="text-slate-500">
          Pagamentos processados com segurança via <span className="text-slate-300 font-semibold">Stripe & Stripe Connect</span>.
        </p>
      </div>
    </footer>
  );
};
