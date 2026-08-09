import { User, Event, Album, Photo, Order, PhotographerMetrics, AdminMetrics } from '../types/index.js';

const API_BASE = '';

function getAuthHeaders() {
  const token = localStorage.getItem('fotovenda_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao realizar login.');
    }
    return res.json();
  },

  async register(data: { name: string; companyName?: string; cpfCnpj?: string; email: string; phone?: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar conta.');
    }
    return res.json();
  },

  async registerAndSubscribe(data: {
    name: string;
    companyName?: string;
    cpfCnpj: string;
    email: string;
    phone: string;
    password: string;
    cardNumber: string;
    cardHolder: string;
    cardExp: string;
    cardCvc: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/register-and-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha no processamento do pagamento e criação de conta.');
    }
    return res.json();
  },

  async me(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error('Sessão inválida');
    }
    return res.json();
  },

  // Photographer Dashboard
  async getPhotographerMetrics(): Promise<PhotographerMetrics> {
    const res = await fetch(`${API_BASE}/api/photographer/metrics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao carregar métricas.');
    return res.json();
  },

  async updateProfile(data: { watermarkText?: string; pixKey?: string; companyName?: string; phone?: string }) {
    const res = await fetch(`${API_BASE}/api/photographer/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao atualizar perfil.');
    return res.json();
  },

  async getEvents(): Promise<Event[]> {
    const res = await fetch(`${API_BASE}/api/photographer/events`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao carregar eventos.');
    return res.json();
  },

  async createEvent(data: { name: string; description?: string; eventDate?: string; location?: string; coverUrl?: string; defaultPrice?: number }) {
    const res = await fetch(`${API_BASE}/api/photographer/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar evento.');
    }
    return res.json();
  },

  async createAlbum(eventId: string, data: { name: string; description?: string }) {
    const res = await fetch(`${API_BASE}/api/photographer/events/${eventId}/albums`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao criar álbum.');
    return res.json();
  },

  async uploadPhotos(eventId: string, formData: FormData) {
    const token = localStorage.getItem('fotovenda_token');
    const res = await fetch(`${API_BASE}/api/photographer/events/${eventId}/photos`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao enviar fotos.');
    }
    return res.json();
  },

  async updateBatchPhotoPrices(photoIds: string[], price: number) {
    const res = await fetch(`${API_BASE}/api/photographer/photos/batch-price`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ photoIds, price })
    });
    if (!res.ok) throw new Error('Erro ao atualizar preços.');
    return res.json();
  },

  // Public Client Gallery
  async getPublicEvent(photographerSlug: string, eventSlug: string): Promise<{ event: Event; albums: Album[]; photosCount: number; photographerName: string }> {
    const res = await fetch(`${API_BASE}/api/public/events/${photographerSlug}/${eventSlug}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Evento não encontrado.');
    }
    return res.json();
  },

  async getPublicPhotos(eventId: string, albumId?: string, search?: string): Promise<{ photos: Photo[] }> {
    const params = new URLSearchParams();
    if (albumId) params.append('albumId', albumId);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/api/public/events/${eventId}/photos?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar fotos.');
    return res.json();
  },

  async createCheckout(data: {
    orderToken: string;
    photographerId: string;
    eventId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: Array<{ photoId: string; photoNumber: string; price: number; previewUrl: string }>;
  }) {
    const res = await fetch(`${API_BASE}/api/public/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao iniciar checkout.');
    }
    return res.json();
  },

  async getOrderDetails(orderToken: string): Promise<{ order: Order & { photos: Array<{ id: string; photoNumber: string; price: number; downloadUrl: string; filename: string }> } }> {
    const res = await fetch(`${API_BASE}/api/public/order/${orderToken}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Pedido não encontrado.');
    }
    return res.json();
  },

  // Stripe integrations
  async getStripeConnectLink() {
    const res = await fetch(`${API_BASE}/api/stripe/connect/onboard`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao gerar link do Stripe Connect.');
    return res.json();
  },

  async createProSubscription() {
    const res = await fetch(`${API_BASE}/api/stripe/subscription/pro`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao assinar Plano Profissional.');
    return res.json();
  },

  async processCardSubscription(data: { cardNumber: string; cardHolder: string; cardExp: string; cardCvc: string }) {
    const res = await fetch(`${API_BASE}/api/stripe/subscription/process-card`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao processar pagamento com cartão.');
    }
    return res.json();
  },

  // Admin
  async getAdminMetrics(): Promise<AdminMetrics> {
    const res = await fetch(`${API_BASE}/api/admin/metrics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao carregar dados administrativos.');
    return res.json();
  },

  async getAdminPhotographers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/api/admin/photographers`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erro ao carregar fotógrafos.');
    return res.json();
  }
};
