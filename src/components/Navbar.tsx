import React, { useState } from 'react';
import { Camera, User as UserIcon, LogOut, Menu, X, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/index';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                {APP_CONFIG.appName}
              </span>
              <span className="text-xs block -mt-1 font-semibold text-indigo-600 tracking-wider uppercase">
                SaaS Fotos
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'home' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'pricing' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planos & Preços
            </button>
            <button
              onClick={() => onNavigate('demo_gallery')}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Ver Galeria Exemplo
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-xs"
                >
                  <UserIcon className="w-4 h-4" />
                  Painel do Fotógrafo
                </button>
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Admin
                  </button>
                )}
                <button
                  onClick={logout}
                  title="Sair"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-xs"
                >
                  Criar Conta Grátis
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-3">
          <button
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
          >
            Início
          </button>
          <button
            onClick={() => { onNavigate('pricing'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
          >
            Planos & Preços
          </button>
          <button
            onClick={() => { onNavigate('demo_gallery'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-sm font-medium text-amber-600 font-semibold"
          >
            Ver Galeria Exemplo (Corrida 2026)
          </button>
          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium text-center"
              >
                Ir para o Painel
              </button>
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold text-center"
                >
                  Painel de Administração
                </button>
              )}
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full py-2 text-left text-xs text-rose-600 font-medium"
              >
                Sair da conta ({user.name})
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 text-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
              >
                Entrar
              </button>
              <button
                onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 text-center rounded-xl bg-indigo-600 text-white text-sm font-medium"
              >
                Cadastrar
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
