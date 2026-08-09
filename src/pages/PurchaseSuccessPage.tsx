import React, { useState, useEffect } from 'react';
import { CheckCircle2, Download, Share2, Sparkles, Image as ImageIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import JSZip from 'jszip';
import { api } from '../lib/api';

interface PurchaseSuccessPageProps {
  orderToken: string;
  onNavigate: (view: string, params?: any) => void;
}

export const PurchaseSuccessPage: React.FC<PurchaseSuccessPageProps> = ({
  orderToken,
  onNavigate
}) => {
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      try {
        const res = await api.getOrderDetails(orderToken);
        setOrderDetails(res.order);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderToken]);

  const handleDownloadZip = async () => {
    if (!orderDetails || !orderDetails.photos) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Fotos_${orderDetails.eventName.replace(/[^a-zA-Z0-9]/g, '_')}`);

      for (const p of orderDetails.photos) {
        const response = await fetch(p.downloadUrl);
        const blob = await response.blob();
        folder?.file(p.filename || `foto_${p.photoNumber}.jpg`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fotos_Compradas_${orderDetails.eventName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Erro ao gerar arquivo ZIP.');
    } finally {
      setZipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">Confirmando pagamento e liberando suas fotos...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Pedido não encontrado</h2>
          <button onClick={() => onNavigate('home')} className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
            Ir para o Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Pagamento Confirmado! 🎉
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Obrigado, <span className="font-bold text-slate-900">{orderDetails.customerName}</span>! Suas fotografias do evento <span className="font-bold text-slate-900">{orderDetails.eventName}</span> já estão prontas para download sem marca d'água em alta resolução.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Link de Acesso Permanente Seguro</span>
          </div>
        </div>

        {/* Downloads Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Suas Fotografias ({orderDetails.photos.length})</h2>
              <p className="text-xs text-slate-500">Clique para baixar individualmente ou baixe o pacote completo</p>
            </div>

            {orderDetails.photos.length > 1 && (
              <button
                onClick={handleDownloadZip}
                disabled={zipping}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {zipping ? 'Gerando Pacote ZIP...' : 'Baixar Todas as Fotos (ZIP)'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderDetails.photos.map((p: any, idx: number) => (
              <div key={p.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    #{p.photoNumber}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{p.filename}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Resolução Original Liberada</div>
                  </div>
                </div>

                <a
                  href={p.downloadUrl}
                  download
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
