import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Calendar, Image as ImageIcon, DollarSign, Ban, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { AdminMetrics, User } from '../types/index';

interface AdminDashboardPageProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [photographers, setPhotographers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [m, p] = await Promise.all([
          api.getAdminMetrics(),
          api.getAdminPhotographers()
        ]);
        setMetrics(m);
        setPhotographers(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold">Carregando dados da plataforma SaaS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans pb-20">
      {/* Top Header */}
      <div className="bg-slate-950 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Painel do Administrador</h1>
              <p className="text-xs text-slate-400">Controle global de fotógrafos, eventos e métricas de vendas</p>
            </div>
          </div>

          <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl">
            Painel Fotógrafo
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Fotógrafos Cadastrados</span>
            <span className="text-3xl font-black text-white">{metrics?.totalPhotographers || 0}</span>
            <div className="text-[11px] text-slate-400 mt-2">
              PRO: <span className="text-indigo-400 font-bold">{metrics?.proSubscribersCount || 0}</span> | Grátis: {metrics?.freeUsersCount || 0}
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Eventos Ativos</span>
            <span className="text-3xl font-black text-white">{metrics?.totalEvents || 0}</span>
            <div className="text-[11px] text-slate-400 mt-2">
              Fotos totais: <span className="text-white font-bold">{metrics?.totalPhotos || 0}</span>
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Volume Bruto Vendido</span>
            <span className="text-3xl font-black text-white">R$ {(metrics?.salesThisMonth || 0).toFixed(2)}</span>
            <div className="text-[11px] text-slate-400 mt-2">Volume acumulado nas galerias</div>
          </div>

          <div className="bg-indigo-950 p-5 rounded-2xl border border-indigo-800">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">Receita da Plataforma</span>
            <span className="text-3xl font-black text-emerald-400">R$ {(metrics?.platformRevenue || 0).toFixed(2)}</span>
            <div className="text-[11px] text-indigo-200 mt-2">Comissões (5%) + Assinaturas Mensais</div>
          </div>
        </div>

        {/* Photographers Table */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Fotógrafos na Plataforma ({photographers.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Fotógrafo / Empresa</th>
                  <th className="p-3">E-mail / WhatsApp</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Stripe Connect</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {photographers.map(p => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-white">
                      {p.name}
                      {p.companyName && <span className="block text-[10px] text-slate-400">{p.companyName}</span>}
                    </td>
                    <td className="p-3 text-slate-300">{p.email} <br />{p.phone}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${p.plan === 'PRO' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>
                        {p.plan}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${p.stripeAccountStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {p.stripeAccountStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold">
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
