import fs from 'fs';
import path from 'path';
import { User, Event, Album, Photo, Order, Subscription, PlanType, PhotographerMetrics, AdminMetrics } from '../src/types/index.js';
import { WatermarkService } from './services/watermark.js';

interface DatabaseSchema {
  users: User[];
  events: Event[];
  albums: Album[];
  photos: Photo[];
  orders: Order[];
  subscriptions: Subscription[];
  webhookEvents: { id: string; eventId: string; type: string; processedAt: string }[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function calculatePlatformFee(grossAmount: number, _plan?: PlanType) {
  const platformFeeRate = 0.05; // 5% comissão sobre cada venda de foto
  const platformFeeAmount = Math.round(grossAmount * platformFeeRate * 100) / 100;
  // Estimated Stripe Fee (e.g. ~3.99% + R$0.39 for Brazil)
  const stripeFeeEstimate = Math.round((grossAmount * 0.0399 + 0.39) * 100) / 100;
  const photographerPayoutAmount = Math.max(0, Math.round((grossAmount - platformFeeAmount - stripeFeeEstimate) * 100) / 100);

  return {
    platformFeeAmount,
    stripeFeeEstimate,
    photographerPayoutAmount
  };
}

class DatabaseService {
  private db: DatabaseSchema = {
    users: [],
    events: [],
    albums: [],
    photos: [],
    orders: [],
    subscriptions: [],
    webhookEvents: []
  };

  constructor() {
    this.load();
    this.seedDefaultsIfEmpty();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load DB file, starting with empty DB', err);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB file', err);
    }
  }

  private seedDefaultsIfEmpty() {
    if (this.db.users.length === 0) {
      // Seed default Photographer
      const demoPhotographer: User = {
        id: 'user_photographer_1',
        name: 'João Silva Fotografia',
        companyName: 'João Silva Fotos ME',
        cpfCnpj: '123.456.789-00',
        email: 'joao@fotografia.com',
        phone: '11999998888',
        role: 'PHOTOGRAPHER',
        plan: 'FREE', // Start on FREE plan
        stripeAccountId: 'acct_1DemoPhotographer123',
        stripeAccountStatus: 'VERIFIED',
        watermarkText: 'JOÃO SILVA FOTOGRAFIA',
        pixKey: 'joao@fotografia.com',
        createdAt: new Date().toISOString()
      };

      // Seed default Admin
      const demoAdmin: User = {
        id: 'user_admin_1',
        name: 'Administrador Platform',
        email: 'admin@fotovenda.com',
        role: 'ADMIN',
        plan: 'PRO',
        stripeAccountStatus: 'VERIFIED',
        createdAt: new Date().toISOString()
      };

      this.db.users.push(demoPhotographer, demoAdmin);

      // Seed default Event
      const demoEvent: Event = {
        id: 'evt_corrida_sp_2026',
        photographerId: demoPhotographer.id,
        photographerName: demoPhotographer.name,
        photographerSlug: 'joao-fotografia',
        name: 'Corrida São Paulo 2026',
        slug: 'corrida-sp-2026',
        description: 'Fotografias oficiais da maior corrida de rua de São Paulo. Encontre suas fotos pelo número do peito!',
        eventDate: '2026-08-10',
        location: 'Parque Ibirapuera, São Paulo - SP',
        coverUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
        defaultPrice: 15.00,
        status: 'PUBLISHED',
        viewsCount: 142,
        createdAt: new Date().toISOString()
      };

      this.db.events.push(demoEvent);

      // Seed Albums
      const album1: Album = {
        id: 'alb_10km',
        eventId: demoEvent.id,
        name: 'Percurso 10 KM',
        description: 'Fotos na marcação do km 7 e chegada',
        displayOrder: 1,
        createdAt: new Date().toISOString()
      };

      const album2: Album = {
        id: 'alb_5km',
        eventId: demoEvent.id,
        name: 'Percurso 5 KM',
        description: 'Fotos da largada e do pórtico principal',
        displayOrder: 2,
        createdAt: new Date().toISOString()
      };

      const album3: Album = {
        id: 'alb_premiacao',
        eventId: demoEvent.id,
        name: 'Pódio e Premiação',
        description: 'Entrega de troféus e celebração dos atletas',
        displayOrder: 3,
        createdAt: new Date().toISOString()
      };

      this.db.albums.push(album1, album2, album3);

      // Seed Sample Photos
      const samplePhotoList = [
        { num: '1024', albumId: 'alb_10km', price: 15.00, bg: '#1e3a8a', title: 'Atleta #1024 - Km 7' },
        { num: '1025', albumId: 'alb_10km', price: 15.00, bg: '#065f46', title: 'Atleta #1025 - Sprint Final' },
        { num: '1026', albumId: 'alb_10km', price: 20.00, bg: '#831843', title: 'Atleta #1026 - Chegada Triunfal' },
        { num: '2041', albumId: 'alb_5km', price: 15.00, bg: '#4c1d95', title: 'Atleta #2041 - Largada 5K' },
        { num: '2042', albumId: 'alb_5km', price: 15.00, bg: '#78350f', title: 'Atleta #2042 - Curva do Obelisco' },
        { num: '2043', albumId: 'alb_5km', price: 15.00, bg: '#134e4a', title: 'Atleta #2043 - Reta Final 5K' },
        { num: '3001', albumId: 'alb_premiacao', price: 25.00, bg: '#701a75', title: 'Pódio Geral Masculino 1º Lugar' },
        { num: '3002', albumId: 'alb_premiacao', price: 25.00, bg: '#312e81', title: 'Pódio Geral Feminino 1º Lugar' }
      ];

      samplePhotoList.forEach((item, idx) => {
        const photoId = `photo_sample_${idx + 1}`;
        const rawSvg = WatermarkService.generateSamplePhotoDataUrl(item.title, item.bg);
        const watermarkedPreview = WatermarkService.generateWatermarkedSvgUrl(rawSvg, demoPhotographer.watermarkText || 'JOÃO SILVA FOTOGRAFIA');

        const photoObj: Photo = {
          id: photoId,
          eventId: demoEvent.id,
          albumId: item.albumId,
          photographerId: demoPhotographer.id,
          filename: `foto_${item.num}.jpg`,
          originalPath: rawSvg, // Safe data URI original
          previewUrl: watermarkedPreview,
          thumbnailUrl: watermarkedPreview,
          price: item.price,
          photoNumber: item.num,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };

        this.db.photos.push(photoObj);
      });

      // Seed Initial Order for Demo Metrics
      const demoOrder: Order = {
        id: 'ord_demo_9876',
        orderToken: 'tok_demo_9876_xyz',
        photographerId: demoPhotographer.id,
        photographerName: demoPhotographer.name,
        eventId: demoEvent.id,
        eventName: demoEvent.name,
        customerName: 'Carlos Eduardo',
        customerEmail: 'carlos.cliente@gmail.com',
        customerPhone: '11988887777',
        totalAmount: 45.00,
        platformFeeAmount: 2.25, // 5% comissão (R$ 2,25)
        photographerPayoutAmount: 40.56,
        stripeFeeEstimate: 2.19,
        paymentStatus: 'PAID',
        items: [
          {
            id: 'item_1',
            orderId: 'ord_demo_9876',
            photoId: 'photo_sample_1',
            photoNumber: '1024',
            price: 15.00,
            previewUrl: this.db.photos[0]?.previewUrl || ''
          },
          {
            id: 'item_2',
            orderId: 'ord_demo_9876',
            photoId: 'photo_sample_2',
            photoNumber: '1025',
            price: 15.00,
            previewUrl: this.db.photos[1]?.previewUrl || ''
          },
          {
            id: 'item_3',
            orderId: 'ord_demo_9876',
            photoId: 'photo_sample_4',
            photoNumber: '2041',
            price: 15.00,
            previewUrl: this.db.photos[3]?.previewUrl || ''
          }
        ],
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      this.db.orders.push(demoOrder);

      this.save();
    }
  }

  // User methods
  public getUsers(): User[] {
    return this.db.users;
  }

  public getUserById(id: string): User | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.db.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.db.users[idx] = { ...this.db.users[idx], ...updates };
      this.save();
      return this.db.users[idx];
    }
    return undefined;
  }

  // Event methods
  public getEvents(photographerId?: string): Event[] {
    if (photographerId) {
      return this.db.events.filter(e => e.photographerId === photographerId && e.status !== 'ARCHIVED');
    }
    return this.db.events.filter(e => e.status !== 'ARCHIVED');
  }

  public getEventBySlug(photographerSlug: string, eventSlug: string): Event | undefined {
    return this.db.events.find(
      e => e.photographerSlug === photographerSlug && e.slug === eventSlug && e.status !== 'ARCHIVED'
    );
  }

  public getEventById(id: string): Event | undefined {
    return this.db.events.find(e => e.id === id);
  }

  public addEvent(event: Event): Event {
    this.db.events.push(event);
    this.save();
    return event;
  }

  public updateEvent(id: string, updates: Partial<Event>): Event | undefined {
    const idx = this.db.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.db.events[idx] = { ...this.db.events[idx], ...updates };
      this.save();
      return this.db.events[idx];
    }
    return undefined;
  }

  // Album methods
  public getAlbumsByEventId(eventId: string): Album[] {
    return this.db.albums.filter(a => a.eventId === eventId);
  }

  public addAlbum(album: Album): Album {
    this.db.albums.push(album);
    this.save();
    return album;
  }

  // Photo methods
  public getPhotosByEventId(eventId: string, albumId?: string): Photo[] {
    return this.db.photos.filter(p => p.eventId === eventId && (!albumId || p.albumId === albumId) && p.status === 'ACTIVE');
  }

  public getPhotoById(id: string): Photo | undefined {
    return this.db.photos.find(p => p.id === id);
  }

  public addPhoto(photo: Photo): Photo {
    this.db.photos.push(photo);
    this.save();
    return photo;
  }

  public updatePhotoPrice(photoId: string, price: number): Photo | undefined {
    const photo = this.db.photos.find(p => p.id === photoId);
    if (photo) {
      photo.price = price;
      this.save();
    }
    return photo;
  }

  public updateBatchPhotoPrices(photoIds: string[], price: number) {
    this.db.photos.forEach(p => {
      if (photoIds.includes(p.id)) {
        p.price = price;
      }
    });
    this.save();
  }

  // Order methods
  public addOrder(order: Order): Order {
    this.db.orders.push(order);
    this.save();
    return order;
  }

  public getOrderByToken(token: string): Order | undefined {
    return this.db.orders.find(o => o.orderToken === token);
  }

  public getOrderById(id: string): Order | undefined {
    return this.db.orders.find(o => o.id === id);
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | undefined {
    const idx = this.db.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.db.orders[idx] = { ...this.db.orders[idx], ...updates };
      this.save();
      return this.db.orders[idx];
    }
    return undefined;
  }

  public getOrdersByPhotographer(photographerId: string): Order[] {
    return this.db.orders.filter(o => o.photographerId === photographerId);
  }

  // Subscription methods
  public addSubscription(sub: Subscription): Subscription {
    this.db.subscriptions.push(sub);
    this.save();
    return sub;
  }

  public getSubscriptionByUserId(userId: string): Subscription | undefined {
    return this.db.subscriptions.find(s => s.userId === userId && s.status === 'ACTIVE');
  }

  // Webhook idempotency
  public isWebhookProcessed(eventId: string): boolean {
    return this.db.webhookEvents.some(e => e.eventId === eventId);
  }

  public markWebhookProcessed(eventId: string, type: string) {
    this.db.webhookEvents.push({
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventId,
      type,
      processedAt: new Date().toISOString()
    });
    this.save();
  }

  // Analytics & Metrics
  public getPhotographerMetrics(photographerId: string): PhotographerMetrics {
    const user = this.getUserById(photographerId);
    const events = this.getEvents(photographerId);
    const orders = this.getOrdersByPhotographer(photographerId);
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformFeesPaid = paidOrders.reduce((sum, o) => sum + o.platformFeeAmount, 0);
    const availableBalance = paidOrders.reduce((sum, o) => sum + o.photographerPayoutAmount, 0);

    const photosCount = this.db.photos.filter(p => p.photographerId === photographerId && p.status === 'ACTIVE').length;

    return {
      salesThisMonth: paidOrders.length,
      totalRevenue,
      availableBalance,
      activeEventsCount: events.filter(e => e.status === 'PUBLISHED').length,
      publishedPhotosCount: photosCount,
      platformFeesPaid,
      recentOrders: orders.slice(-10).reverse()
    };
  }

  public getAdminMetrics(): AdminMetrics {
    const photographers = this.db.users.filter(u => u.role === 'PHOTOGRAPHER');
    const events = this.db.events;
    const photos = this.db.photos;
    const paidOrders = this.db.orders.filter(o => o.paymentStatus === 'PAID');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformRevenue = paidOrders.reduce((sum, o) => sum + o.platformFeeAmount, 0);

    return {
      totalPhotographers: photographers.length,
      totalEvents: events.length,
      totalPhotos: photos.length,
      salesToday: paidOrders.length,
      salesThisMonth: totalRevenue,
      platformRevenue,
      proSubscribersCount: photographers.filter(p => p.plan === 'PRO').length,
      freeUsersCount: photographers.filter(p => p.plan === 'FREE').length,
      recentOrders: this.db.orders.slice(-15).reverse()
    };
  }
}

export const db = new DatabaseService();
