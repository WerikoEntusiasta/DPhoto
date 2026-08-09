import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/index';
import { DPhotoLogo } from '../components/DPhotoLogo';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  // Quick demo account loggers
  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, '123456');
      if (demoEmail.includes('admin')) {
        onNavigate('admin');
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro no login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <DPhotoLogo size="lg" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Acessar sua conta
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Painel do fotógrafo no DPhoto
          </p>
        </div>

        {/* Demo Quick Logins Box */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2">
          <div className="font-bold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Acesso Rápido para Testes Demo:
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin('joao@fotografia.com')}
              className="flex-1 py-2 px-3 bg-white border border-indigo-200 rounded-xl font-semibold text-indigo-700 hover:bg-indigo-100 text-xs transition-colors"
            >
              Fotógrafo Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@fotovenda.com')}
              className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 text-xs transition-colors"
            >
              Admin Demo
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Acessando...' : 'Entrar no Painel'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-600">
          Ainda não tem conta?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-bold text-indigo-600 hover:text-indigo-700"
          >
            Cadastre-se gratuitamente
          </button>
        </div>
      </div>
    </div>
  );
};
