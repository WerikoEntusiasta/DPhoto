import React, { useState, useEffect } from 'react';
import { Camera, Search, ShoppingBag, Check, X, ArrowRight, Share2, Lock, Sparkles, Filter, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Event, Album, Photo } from '../types/index';

interface PublicEventGalleryPageProps {
  photographerSlug: string;
  eventSlug: string;
  onNavigate: (view: string, params?: any) => void;
}

export const PublicEventGalleryPage: React.FC<PublicEventGalleryPageProps> = ({
  photographerSlug,
  eventSlug,
  onNavigate
}) => {
  const [eventData, setEventData] = useState<{ event: Event; albums: Album[]; photographerName: string } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<Photo[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Zoom photo modal
  const [activePhotoModal, setActivePhotoModal] = useState<Photo | null>(null);

  // Customer Checkout Modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const loadGalleryData = async () => {
    setLoading(true);
    try {
      const res = await api.getPublicEvent(photographerSlug, eventSlug);
      setEventData({ event: res.event, albums: res.albums, photographerName: res.photographerName });

      if (res.event?.id) {
        try {
          const photosRes = await api.getPublicPhotos(res.event.id);
          setPhotos(photosRes.photos || []);
        } catch (photoErr) {
          console.error('Error fetching photos for event', photoErr);
          setPhotos([]);
        }
      }
    } catch (err: any) {
      console.error('Gallery loading error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, [photographerSlug, eventSlug]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!eventData) return;
    try {
      const res = await api.getPublicPhotos(eventData.event.id, activeAlbumId, query);
      setPhotos(res.photos);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAlbum = async (albumId: string) => {
    setActiveAlbumId(albumId);
    if (!eventData) return;
    try {
      const res = await api.getPublicPhotos(eventData.event.id, albumId, searchQuery);
      setPhotos(res.photos);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePhotoInCart = (photo: Photo) => {
    if (cart.some(p => p.id === photo.id)) {
      setCart(cart.filter(p => p.id !== photo.id));
    } else {
      setCart([...cart, photo]);
    }
  };

  const isPhotoInCart = (photoId: string) => cart.some(p => p.id === photoId);

  const cartTotal = cart.reduce((sum, p) => sum + p.price, 0);

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !eventData) return;

    setSubmittingCheckout(true);
    try {
      const orderToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await api.createCheckout({
        orderToken,
        photographerId: eventData.event.photographerId,
        eventId: eventData.event.id,
        customerName,
        customerEmail,
        customerPhone,
        items: cart.map(p => ({
          photoId: p.id,
          photoNumber: p.photoNumber,
          price: p.price,
          previewUrl: p.previewUrl
        }))
      });

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar compra.');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">Carregando galeria do evento...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Evento não encontrado</h2>
          <p className="text-xs text-slate-500 mb-6">O link pode estar incorreto ou o evento foi removido pelo fotógrafo.</p>
          <button onClick={() => onNavigate('home')} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">
            Ir para a Página Inicial
          </button>
        </div>
      </div>
    );
  }

  const { event, albums, photographerName } = eventData;

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans pb-32">
      {/* EVENT HERO HEADER */}
      <div className="relative bg-slate-950 border-b border-slate-800">
        <div className="h-64 sm:h-80 w-full relative overflow-hidden">
          <img src={event.coverUrl} alt={event.name} className="w-full h-full object-cover opacity-40 blur-xs scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-32 pb-8 z-10 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
              <Camera className="w-3.5 h-3.5" />
              Fotografia por {photographerName}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {event.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {event.eventDate} • {event.location || 'Brasil'} • {event.description}
            </p>
          </div>

          <button
            onClick={() => {
              const msg = `Olá! Confira as fotos do evento "${event.name}": ${window.location.href}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      {/* SEARCH BAR & ALBUM FILTERS */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Digite o número do peito ou da foto (ex: 1024)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Album pills */}
          <div className="flex gap-2 overflow-x-auto justify-center pb-1">
            <button
              onClick={() => handleSelectAlbum('')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeAlbumId === '' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas as fotos
            </button>
            {albums.map(alb => (
              <button
                key={alb.id}
                onClick={() => handleSelectAlbum(alb.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  activeAlbumId === alb.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {alb.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PHOTOS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-slate-950 rounded-3xl border border-slate-800">
            <p className="text-slate-400 text-sm">Nenhuma foto encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {photos.map(p => {
              const selected = isPhotoInCart(p.id);
              return (
                <div
                  key={p.id}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-800 border transition-all cursor-pointer ${
                    selected ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-800 hover:border-slate-700'
                  }`}
                  onClick={() => setActivePhotoModal(p)}
                >
                  <div className="aspect-4/3 relative overflow-hidden bg-slate-900">
                    <img src={p.previewUrl} alt={p.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    
                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-950/80 backdrop-blur-xs text-amber-400 font-extrabold text-xs rounded-full border border-slate-700/50">
                      R$ {p.price.toFixed(2)}
                    </div>

                    {/* Photo Number */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/80 text-white font-bold text-[10px] rounded-md">
                      #{p.photoNumber}
                    </div>
                  </div>

                  {/* Quick Select Button Bar */}
                  <div className="p-2.5 bg-slate-900 flex justify-between items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhotoInCart(p);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        selected ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {selected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Selecionada
                        </>
                      ) : (
                        'Selecionar Foto'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-lg border border-indigo-500/40 p-4 rounded-2xl shadow-2xl z-40 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-indigo-300 font-semibold">{cart.length} foto(s) selecionada(s)</div>
            <div className="text-xl font-black text-white">Total: R$ {cartTotal.toFixed(2)}</div>
          </div>

          <button
            onClick={() => setCheckoutOpen(true)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
          >
            Comprar Fotos ({cart.length})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PHOTO ZOOM MODAL */}
      {activePhotoModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-3xl w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative max-h-[70vh] flex items-center justify-center bg-black">
              <img src={activePhotoModal.previewUrl} alt={activePhotoModal.filename} className="max-h-[65vh] w-auto object-contain" />
            </div>

            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border-t border-slate-800">
              <div>
                <h3 className="font-bold text-white text-lg">Fotografia #{activePhotoModal.photoNumber}</h3>
                <p className="text-xs text-slate-400">Preview protegido. A versão comprada será entregue em altíssima resolução sem marca d'água.</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-amber-400">R$ {activePhotoModal.price.toFixed(2)}</span>
                <button
                  onClick={() => {
                    togglePhotoInCart(activePhotoModal);
                    setActivePhotoModal(null);
                  }}
                  className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 ${
                    isPhotoInCart(activePhotoModal.id) ? 'bg-indigo-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isPhotoInCart(activePhotoModal.id) ? 'Remover do Carrinho' : 'Adicionar ao Carrinho'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CHECKOUT MODAL (No Account Required!) */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">Finalizar Compra</h3>
                <p className="text-xs text-slate-400">Insira seus dados para receber o link de download</p>
              </div>
              <button onClick={() => setCheckoutOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-300">
                <span>{cart.length} fotografia(s) selecionada(s)</span>
                <span className="text-amber-400">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleStartCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Seu Nome *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">E-mail para entrega das fotos *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">WhatsApp (opcional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div className="text-[11px] text-slate-400 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold rounded text-[10px]">⚡ Pix</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold rounded text-[10px]">💳 Cartão de Crédito</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pagamento 100% seguro por Pix ou Cartão via Stripe.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingCheckout}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {submittingCheckout ? 'Ir para Pagamento...' : `Pagar R$ ${cartTotal.toFixed(2)} com Stripe`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
