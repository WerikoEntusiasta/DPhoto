import React, { useState, useEffect } from 'react';
import {
  Camera, Calendar, DollarSign, Image as ImageIcon, CreditCard, Settings,
  Plus, ExternalLink, Share2, Copy, Check, Upload, Trash2, Edit3, ShieldAlert,
  ArrowRight, Sparkles, AlertCircle, RefreshCw, Layers, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { OnboardingChecklist } from '../components/OnboardingChecklist';
import { PhotographerMetrics, Event, Album, Photo } from '../types/index';
import { APP_CONFIG } from '../config/index';

interface DashboardPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'stripe' | 'subscription' | 'settings'>('overview');
  const [metrics, setMetrics] = useState<PhotographerMetrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Modal state
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventPrice, setNewEventPrice] = useState(15.00);

  // Active Event Detail state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventAlbums, setSelectedEventAlbums] = useState<Album[]>([]);
  const [selectedEventPhotos, setSelectedEventPhotos] = useState<Photo[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string>('');

  // New Album Modal
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  // Upload Photos state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Batch Price Modal
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [batchPriceInput, setBatchPriceInput] = useState<number>(15.00);

  // Profile Settings state
  const [watermarkInput, setWatermarkInput] = useState(user?.watermarkText || '');
  const [pixKeyInput, setPixKeyInput] = useState(user?.pixKey || '');
  const [savingSettings, setSavingSettings] = useState(false);

  const [subscriptionBanner, setSubscriptionBanner] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [m, evs] = await Promise.all([
        api.getPhotographerMetrics(),
        api.getEvents()
      ]);
      setMetrics(m);
      setEvents(evs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Check if redirected after subscription checkout
    const params = new URLSearchParams(window.location.search);
    const subStatus = params.get('subscription');
    const sessionId = params.get('session_id');

    if (subStatus === 'success' || subStatus === 'success_mock') {
      if (sessionId) {
        api.verifySubscriptionSession(sessionId).then(() => {
          refreshUser();
        }).catch(err => console.error(err));
      } else {
        refreshUser();
      }
      setSubscriptionBanner('Parabéns! Sua assinatura do Plano Fotógrafo Pro foi ativada com sucesso.');
    } else if (subStatus === 'cancelled') {
      setSubscriptionBanner('O processo de assinatura foi cancelado. Você pode tentar novamente a qualquer momento.');
    }
  }, []);

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEvent({
        name: newEventName,
        description: newEventDesc,
        eventDate: newEventDate,
        location: newEventLocation,
        defaultPrice: Number(newEventPrice)
      });
      setShowNewEventModal(false);
      setNewEventName('');
      setNewEventDesc('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar evento.');
    }
  };

  // Open Event Details
  const handleSelectEvent = async (ev: Event) => {
    setSelectedEvent(ev);
    try {
      const res = await api.getPublicEvent(ev.photographerSlug, ev.slug);
      setSelectedEventAlbums(res.albums);
      setActiveAlbumId(res.albums[0]?.id || '');

      const photosRes = await api.getPublicPhotos(ev.id);
      setSelectedEventPhotos(photosRes.photos);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await api.createAlbum(selectedEvent.id, { name: newAlbumName });
      setShowNewAlbumModal(false);
      setNewAlbumName('');
      handleSelectEvent(selectedEvent);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar álbum.');
    }
  };

  // Upload Multi-Photos
  const handlePhotoUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedEvent) return;

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('albumId', activeAlbumId);
    formData.append('price', String(selectedEvent.defaultPrice));

    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    try {
      setUploadProgress(50);
      await api.uploadPhotos(selectedEvent.id, formData);
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        handleSelectEvent(selectedEvent);
        loadDashboardData();
      }, 500);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar fotos.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Batch update prices
  const handleBatchUpdatePrices = async () => {
    if (selectedPhotoIds.length === 0) return;
    try {
      await api.updateBatchPhotoPrices(selectedPhotoIds, batchPriceInput);
      setSelectedPhotoIds([]);
      if (selectedEvent) handleSelectEvent(selectedEvent);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar preços.');
    }
  };

  // Stripe Connect Onboarding
  const handleConnectStripe = async () => {
    try {
      const res = await api.getStripeConnectLink();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao conectar Stripe.');
    }
  };

  // Upgrade to PRO Plan
  const handleUpgradePro = async () => {
    try {
      const res = await api.createProSubscription();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err.message || 'Erro na assinatura.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateProfile({ watermarkText: watermarkInput, pixKey: pixKeyInput });
      await refreshUser();
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getPublicEventUrl = (ev: Event) => {
    return `${window.location.origin}/f/${ev.photographerSlug}/${ev.slug}`;
  };

  const copyEventLink = (ev: Event) => {
    const url = getPublicEventUrl(ev);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareWhatsApp = (ev: Event) => {
    const url = getPublicEventUrl(ev);
    const msg = `Olá! 📸\nAs fotos do evento "${ev.name}" já estão disponíveis.\nConfira e selecione suas fotos aqui:\n${url}\nObrigado!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <span>Painel do Fotógrafo</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${user.plan === 'PRO' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                PLANO {user.plan}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Olá, {user.name} 👋
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedEvent(null); setShowNewEventModal(true); }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Evento
            </button>
          </div>
        </div>

        {/* Subscription Status Notification Banner */}
        {subscriptionBanner && (
          <div className="max-w-7xl mx-auto mt-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>{subscriptionBanner}</span>
            </div>
            <button
              onClick={() => setSubscriptionBanner(null)}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex overflow-x-auto gap-2 text-sm border-b border-slate-100 pb-1">
          <button
            onClick={() => { setActiveTab('overview'); setSelectedEvent(null); }}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'overview' && !selectedEvent ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => { setActiveTab('events'); }}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'events' || selectedEvent ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Meus Eventos ({events.length})
          </button>
          <button
            onClick={() => { setActiveTab('stripe'); setSelectedEvent(null); }}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'stripe' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Financeiro & Stripe Connect
          </button>
          <button
            onClick={() => { setActiveTab('subscription'); setSelectedEvent(null); }}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'subscription' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assinatura (R$ 97,90/mês)
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSelectedEvent(null); }}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Configurações
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Onboarding Checklist */}
        <OnboardingChecklist
          user={user}
          eventsCount={events.length}
          photosCount={metrics?.publishedPhotosCount || 0}
          onNavigateTab={(tab) => {
            if (tab === 'stripe') setActiveTab('stripe');
            if (tab === 'eventos') setActiveTab('events');
          }}
        />

        {/* VIEW: OVERVIEW */}
        {activeTab === 'overview' && !selectedEvent && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Vendas este mês
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {metrics?.salesThisMonth || 0} pedido(s)
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Total vendido
                </span>
                <span className="text-2xl font-black text-slate-900">
                  R$ {(metrics?.totalRevenue || 0).toFixed(2)}
                </span>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                  Saldo disponível
                </span>
                <span className="text-2xl font-black text-emerald-900">
                  R$ {(metrics?.availableBalance || 0).toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Eventos ativos
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {metrics?.activeEventsCount || 0}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Fotos publicadas
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {metrics?.publishedPhotosCount || 0}
                </span>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Últimas vendas</h3>
              {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  {metrics.recentOrders.map(ord => (
                    <div key={ord.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <div className="font-bold text-slate-900">{ord.customerName}</div>
                        <div className="text-xs text-slate-500">{ord.eventName} • {ord.items.length} foto(s)</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">R$ {ord.totalAmount.toFixed(2)}</div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${ord.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {ord.paymentStatus === 'PAID' ? 'PAGO' : ord.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Você ainda não possui vendas registradas. Compartilhe o link do seu evento para começar a vender!
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: EVENTS LIST */}
        {activeTab === 'events' && !selectedEvent && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Seus Eventos</h2>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Novo Evento
              </button>
            </div>

            {events.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum evento criado</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  Crie seu primeiro evento para subir fotos e compartilhar com seus clientes.
                </p>
                <button
                  onClick={() => setShowNewEventModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl"
                >
                  Criar Primeiro Evento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="h-40 bg-slate-200 relative overflow-hidden">
                        <img
                          src={ev.coverUrl}
                          alt={ev.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-slate-900/80 text-white text-[10px] font-bold rounded-full uppercase backdrop-blur-xs">
                          {ev.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 text-base mb-1">{ev.name}</h3>
                        <p className="text-xs text-slate-500 mb-3">{ev.eventDate} • {ev.location || 'Sem local'}</p>
                        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                          <span>Preço padrão foto:</span>
                          <span className="font-bold text-slate-900">R$ {ev.defaultPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-2">
                      <button
                        onClick={() => handleSelectEvent(ev)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Gerenciar Fotos & Álbuns
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyEventLink(ev)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedLink ? 'Copiado!' : 'Copiar Link'}
                        </button>
                        <button
                          onClick={() => shareWhatsApp(ev)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: SELECTED EVENT MANAGEMENT */}
        {selectedEvent && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-xs font-bold text-indigo-600 hover:underline mb-2 block"
                  >
                    ← Voltar para todos os eventos
                  </button>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedEvent.name}</h2>
                  <p className="text-xs text-slate-500">{selectedEvent.eventDate} • Link Público: {getPublicEventUrl(selectedEvent)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyEventLink(selectedEvent)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                  <button
                    onClick={() => shareWhatsApp(selectedEvent)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => onNavigate('public_event', { photographerSlug: selectedEvent.photographerSlug, eventSlug: selectedEvent.slug })}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Galeria
                  </button>
                </div>
              </div>

              {/* Album Tabs */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 overflow-x-auto">
                  {selectedEventAlbums.map(alb => (
                    <button
                      key={alb.id}
                      onClick={() => setActiveAlbumId(alb.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        activeAlbumId === alb.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {alb.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowNewAlbumModal(true)}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Álbum
                </button>
              </div>

              {/* Photo Upload Box (Drag & Drop) */}
              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-8 text-center relative hover:bg-indigo-50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUploadFiles}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Arraste e solte fotos aqui ou clique para selecionar
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Formatos suportados: JPG, PNG. Preço automático: R$ {selectedEvent.defaultPrice.toFixed(2)} por foto.
                </p>

                {uploading && (
                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="text-xs font-bold text-indigo-700 mb-1">Enviando e aplicando marca d'água... {uploadProgress}%</div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photos Grid & Batch Price Tool */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-base">
                  Fotografias do Álbum ({selectedEventPhotos.filter(p => !activeAlbumId || p.albumId === activeAlbumId).length})
                </h3>

                {selectedPhotoIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-900">{selectedPhotoIds.length} foto(s) selecionada(s)</span>
                    <input
                      type="number"
                      value={batchPriceInput}
                      onChange={e => setBatchPriceInput(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-indigo-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                    <button
                      onClick={handleBatchUpdatePrices}
                      className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-lg"
                    >
                      Alterar Preço em Lote
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedEventPhotos
                  .filter(p => !activeAlbumId || p.albumId === activeAlbumId)
                  .map(p => {
                    const isSelected = selectedPhotoIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`group relative rounded-xl overflow-hidden border transition-all ${
                          isSelected ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-slate-200'
                        }`}
                      >
                        <img src={p.previewUrl} alt={p.filename} className="w-full h-32 object-cover" />
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedPhotoIds(selectedPhotoIds.filter(id => id !== p.id));
                              } else {
                                setSelectedPhotoIds([...selectedPhotoIds, p.id]);
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded-sm"
                          />
                        </div>
                        <div className="p-2 bg-slate-900/90 text-white text-[10px] flex justify-between items-center">
                          <span>#{p.photoNumber}</span>
                          <span className="font-bold text-amber-400">R$ {p.price.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: STRIPE CONNECT & FINANCIALS */}
        {activeTab === 'stripe' && !selectedEvent && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Configuração do Stripe Connect</h2>
                  <p className="text-xs text-slate-500">Conecte sua conta bancária para receber os repasses das suas vendas de fotos</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900">Status Atual:</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    user.stripeAccountStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {user.stripeAccountStatus === 'VERIFIED' ? 'CONTA VERIFICADA E PRONTA PARA RECEBER' : 'ONBOARDING PENDENTE'}
                  </span>
                </div>
                <p className="text-slate-500">
                  ID da Conta Stripe: <code className="bg-slate-200 px-1.5 py-0.5 rounded-sm">{user.stripeAccountId || 'Não cadastrado'}</code>
                </p>
              </div>

              <button
                onClick={handleConnectStripe}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                {user.stripeAccountStatus === 'VERIFIED' ? 'Gerenciar Conta Stripe Connect' : 'Iniciar Verificação Stripe Connect'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SUBSCRIPTION */}
        {activeTab === 'subscription' && !selectedEvent && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Sua Assinatura Mensal</h2>
              <p className="text-xs text-slate-500 mb-6">Status da assinatura e detalhes do plano de fotógrafo</p>

              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-indigo-500 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Plano Ativo</span>
                    <h3 className="font-bold text-2xl text-white">Fotógrafo Pro</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    Ativo (R$ 97,90/mês)
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Valor da Assinatura:</span>
                    <strong className="text-white">R$ 97,90 / mês</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão sobre Vendas:</span>
                    <strong className="text-emerald-400">5% por venda de foto</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Fidelidade / Contrato:</span>
                    <strong className="text-white">Sem fidelidade (cancelamento livre)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Eventos e Fotos:</span>
                    <strong className="text-white">Ilimitados</strong>
                  </div>
                </div>

                <button
                  onClick={handleUpgradePro}
                  className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Gerenciar Assinatura na Stripe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {activeTab === 'settings' && !selectedEvent && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Configurações de Perfil</h2>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Texto da Marca d'água Padrão
                  </label>
                  <input
                    type="text"
                    value={watermarkInput}
                    onChange={e => setWatermarkInput(e.target.value)}
                    placeholder="JOÃO SILVA FOTOGRAFIA"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Este texto será estampado diagonalmente nas miniaturas e previews públicos.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chave Pix (opcional)
                  </label>
                  <input
                    type="text"
                    value={pixKeyInput}
                    onChange={e => setPixKeyInput(e.target.value)}
                    placeholder="joao@fotografia.com"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl"
                >
                  {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: NEW EVENT */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Criar Novo Evento</h3>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nome do Evento *</label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  placeholder="Ex: Copa São Paulo 2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Descrição</label>
                <textarea
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  placeholder="Instruções para os atletas e participantes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Preço por Foto (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={newEventPrice}
                    onChange={e => setNewEventPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Local</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={e => setNewEventLocation(e.target.value)}
                  placeholder="Ex: Parque Ibirapuera, SP"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                >
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW ALBUM */}
      {showNewAlbumModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Novo Álbum no Evento</h3>
            <form onSubmit={handleCreateAlbum} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nome do Álbum *</label>
                <input
                  type="text"
                  required
                  value={newAlbumName}
                  onChange={e => setNewAlbumName(e.target.value)}
                  placeholder="Ex: Chegada 10 KM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAlbumModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                >
                  Criar Álbum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
