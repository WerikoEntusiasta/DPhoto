import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Phone, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, Sparkles, Building2, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DPhotoLogo } from '../components/DPhotoLogo';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { registerAndSubscribe } = useAuth();

  // Account details
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!termsAccepted || !privacyAccepted) {
      setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerAndSubscribe({
        name,
        companyName,
        cpfCnpj,
        email,
        phone,
        password
      });

      if (res?.checkoutUrl) {
        // Redirect directly to official Stripe Checkout Session URL
        window.location.href = res.checkoutUrl;
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta e redirecionar para o Stripe. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-100 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-3">
            <DPhotoLogo size="lg" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            Criar Conta e Assinar Plano Fotógrafo Pro
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Cadastre sua conta e você será redirecionado para a página oficial e segura de pagamento da Stripe.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-2xl flex items-center gap-3 animate-fade-in max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto">
          {/* Left Column: Account Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xs shadow-xl">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Dados Cadastrais</h2>
                  <p className="text-xs text-slate-400">Informações para criação do seu perfil de fotógrafo</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: João Pedro Silva"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Empresa (Opcional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Ex: João Fotos ME"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      CPF ou CNPJ *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={cpfCnpj}
                        onChange={e => setCpfCnpj(e.target.value)}
                        placeholder="000.000.000-00"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      E-mail Principal *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="joao@fotografia.com"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      WhatsApp / Telefone *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(11) 99999-8888"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xs shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Plano Selecionado</span>
              </div>

              <h3 className="text-xl font-black text-white">DPhoto Pro - Plano Fotógrafo</h3>
              <p className="text-xs text-slate-400 mt-1">Cobrança recorrente mensal via Stripe</p>

              <div className="mt-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Mensalidade Pro</span>
                  <span className="font-bold text-white">R$ 97,90</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Comissão por foto vendida</span>
                  <span className="font-semibold text-emerald-400">Apenas 5%</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                  <span className="font-bold text-white">Total a pagar</span>
                  <span className="text-2xl font-black text-indigo-400">R$ 97,90 /mês</span>
                </div>
              </div>

              {/* Benefits checklist */}
              <div className="mt-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Publicação de fotos e eventos ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Proteção por Marca D'água automática</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Repasse automático via Pix e Stripe Connect</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Checkout seguro criptografado do Stripe</span>
                </div>
              </div>

              {/* Legal Checkboxes */}
              <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-3 text-xs text-slate-400">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded-sm bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    Li e concordo com os{' '}
                    <button type="button" onClick={() => onNavigate('terms')} className="text-indigo-400 font-bold hover:underline">
                      Termos de Uso
                    </button>{' '}
                    e atesto a autoria das imagens.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={e => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 rounded-sm bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    Concordo com a{' '}
                    <button type="button" onClick={() => onNavigate('privacy')} className="text-indigo-400 font-bold hover:underline">
                      Política de Privacidade
                    </button>.
                  </span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Redirecionando para o Stripe...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Ir para Checkout Seguro Stripe</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pagamento processado com segurança pela Stripe</span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                Entrar no meu painel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
