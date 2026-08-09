import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, calculatePlatformFee } from './server/db.js';
import { AuthService } from './server/services/auth.js';
import { StripeService } from './server/services/stripe.js';
import { WatermarkService } from './server/services/watermark.js';
import { APP_CONFIG } from './src/config/index.js';
import { Event, Album, Photo, User } from './src/types/index.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middlewares
  app.use(cors());

  // Raw body for Stripe Webhooks
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

  // JSON Body parser for normal API routes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Multer setup for high-volume Photo Uploads
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB per file limit
  });

  // Auth Helper Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    const token = authHeader.split(' ')[1];
    const user = AuthService.verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token de autenticação inválido.' });
    }
    req.user = user;
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    requireAuth(req, res, () => {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
      }
      next();
    });
  };

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', appName: APP_CONFIG.appName });
  });

  // Auth: Register Photographer
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, companyName, cpfCnpj, email, phone, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        companyName: companyName || '',
        cpfCnpj: cpfCnpj || '',
        email,
        phone: phone || '',
        role: 'PHOTOGRAPHER',
        plan: 'FREE',
        stripeAccountStatus: 'NOT_CONNECTED',
        watermarkText: name.toUpperCase(),
        createdAt: new Date().toISOString()
      };

      db.addUser(newUser);
      const token = AuthService.createToken(newUser);

      res.json({ user: newUser, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Register & Subscribe to Pro Plan with Stripe Checkout
  app.post('/api/auth/register-and-subscribe', async (req, res) => {
    try {
      const { name, companyName, cpfCnpj, email, phone, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      // Step 1: Create user in DB with initial FREE plan (will be upgraded by Stripe checkout session or webhook)
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        companyName: companyName || '',
        cpfCnpj: cpfCnpj || '',
        email,
        phone: phone || '',
        role: 'PHOTOGRAPHER',
        plan: 'FREE',
        stripeAccountStatus: 'NOT_CONNECTED',
        watermarkText: name.toUpperCase(),
        createdAt: new Date().toISOString()
      };

      db.addUser(newUser);
      const token = AuthService.createToken(newUser);

      // Step 2: Create Stripe Subscription Checkout Session
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const appBaseUrl = `${protocol}://${host}`;

      const session = await StripeService.createProSubscriptionSession(newUser.id, appBaseUrl);

      const updatedUser = db.getUserById(newUser.id) || newUser;

      res.json({
        user: updatedUser,
        token,
        checkoutUrl: session.url,
        isMock: session.isMock
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Falha ao criar conta e iniciar checkout do Stripe.' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      const token = AuthService.createToken(user);
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth: Current User
  app.get('/api/auth/me', requireAuth, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Photographer: Metrics
  app.get('/api/photographer/metrics', requireAuth, (req: any, res) => {
    try {
      const metrics = db.getPhotographerMetrics(req.user.id);
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Photographer: Profile Update
  app.put('/api/photographer/profile', requireAuth, (req: any, res) => {
    try {
      const { watermarkText, pixKey, companyName, phone } = req.body;
      const updated = db.updateUser(req.user.id, {
        watermarkText,
        pixKey,
        companyName,
        phone
      });
      res.json({ user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Photographer: Get Events
  app.get('/api/photographer/events', requireAuth, (req: any, res) => {
    try {
      const events = db.getEvents(req.user.id);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Photographer: Create Event
  app.post('/api/photographer/events', requireAuth, (req: any, res) => {
    try {
      const { name, description, eventDate, location, coverUrl, defaultPrice } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome do evento é obrigatório.' });
      }

      const photographerSlug = req.user.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const eventSlug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

      const newEvent: Event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        photographerId: req.user.id,
        photographerName: req.user.name,
        photographerSlug,
        name,
        slug: eventSlug,
        description: description || '',
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        location: location || '',
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        defaultPrice: Number(defaultPrice) || 15.00,
        status: 'PUBLISHED',
        viewsCount: 0,
        createdAt: new Date().toISOString()
      };

      db.addEvent(newEvent);

      // Create default album "Geral"
      db.addAlbum({
        id: `alb_geral_${newEvent.id}`,
        eventId: newEvent.id,
        name: 'Geral',
        description: 'Todas as fotos do evento',
        displayOrder: 1,
        createdAt: new Date().toISOString()
      });

      res.json({ event: newEvent });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Photographer: Create Album inside Event
  app.post('/api/photographer/events/:eventId/albums', requireAuth, (req: any, res) => {
    try {
      const { name, description } = req.body;
      const { eventId } = req.params;

      if (!name) {
        return res.status(400).json({ error: 'Nome do álbum é obrigatório.' });
      }

      const albums = db.getAlbumsByEventId(eventId);
      const newAlbum: Album = {
        id: `alb_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        eventId,
        name,
        description: description || '',
        displayOrder: albums.length + 1,
        createdAt: new Date().toISOString()
      };

      db.addAlbum(newAlbum);
      res.json({ album: newAlbum });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Photographer: Multi-Photo Upload Endpoint with watermark preview generation
  app.post('/api/photographer/events/:eventId/photos', requireAuth, upload.array('photos', 50), (req: any, res) => {
    try {
      const { eventId } = req.params;
      const { albumId, price, photoNumberPrefix } = req.body;

      const event = db.getEventById(eventId);
      if (!event || event.photographerId !== req.user.id) {
        return res.status(403).json({ error: 'Evento não encontrado ou acesso negado.' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      const targetAlbumId = albumId || db.getAlbumsByEventId(eventId)[0]?.id || '';
      const photoPrice = Number(price) || event.defaultPrice;
      const watermarkText = req.user.watermarkText || req.user.name.toUpperCase();

      const createdPhotos: Photo[] = [];

      files.forEach((file, index) => {
        const photoNum = `${photoNumberPrefix || 'F'}${Math.floor(1000 + Math.random() * 9000)}`;
        
        // Convert file buffer or base64 to Data URI for safe server storage without filesystem lockouts
        const base64Str = file.buffer.toString('base64');
        const mimeType = file.mimetype || 'image/jpeg';
        const originalDataUri = `data:${mimeType};base64,${base64Str}`;

        // Generate watermarked preview and thumbnail
        const previewUrl = WatermarkService.generateWatermarkedSvgUrl(originalDataUri, watermarkText);

        const photoObj: Photo = {
          id: `photo_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`,
          eventId,
          albumId: targetAlbumId,
          photographerId: req.user.id,
          filename: file.originalname,
          originalPath: originalDataUri,
          previewUrl: previewUrl,
          thumbnailUrl: previewUrl,
          price: photoPrice,
          photoNumber: photoNum,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };

        db.addPhoto(photoObj);
        createdPhotos.push(photoObj);
      });

      res.json({ message: `${createdPhotos.length} fotos enviadas com sucesso!`, photos: createdPhotos });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Photographer: Batch update photo prices
  app.put('/api/photographer/photos/batch-price', requireAuth, (req: any, res) => {
    try {
      const { photoIds, price } = req.body;
      if (!Array.isArray(photoIds) || typeof price !== 'number') {
        return res.status(400).json({ error: 'Identificadores e preço válidos são obrigatórios.' });
      }

      db.updateBatchPhotoPrices(photoIds, price);
      res.json({ success: true, updatedCount: photoIds.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // PUBLIC CLIENT GALLERY & SHOPPING API
  // -------------------------------------------------------------

  // Public: Get Event details by photographer slug and event slug
  app.get('/api/public/events/:photographerSlug/:eventSlug', (req, res) => {
    try {
      const { photographerSlug, eventSlug } = req.params;
      const event = db.getEventBySlug(photographerSlug, eventSlug);

      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado ou indisponível.' });
      }

      // Increment view counter
      db.updateEvent(event.id, { viewsCount: event.viewsCount + 1 });

      const albums = db.getAlbumsByEventId(event.id);
      const photos = db.getPhotosByEventId(event.id);

      res.json({
        event,
        albums,
        photosCount: photos.length,
        photographerName: event.photographerName
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: Get Photos for event with optional album filter & number search
  app.get('/api/public/events/:eventId/photos', (req, res) => {
    try {
      const { eventId } = req.params;
      const { albumId, search } = req.query;

      let photos = db.getPhotosByEventId(eventId, albumId as string);

      if (search) {
        const query = (search as string).toLowerCase().trim();
        photos = photos.filter(p => p.photoNumber.toLowerCase().includes(query) || p.filename.toLowerCase().includes(query));
      }

      res.json({ photos });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: Create Stripe Checkout Session for Photo Purchases
  app.post('/api/public/checkout', async (req, res) => {
    try {
      const { orderToken, photographerId, eventId, customerName, customerEmail, customerPhone, items } = req.body;

      if (!items || items.length === 0 || !customerName || !customerEmail) {
        return res.status(400).json({ error: 'Nome, e-mail e fotos são obrigatórios para o checkout.' });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const appBaseUrl = `${protocol}://${host}`;

      const checkoutData = await StripeService.createPhotoCheckoutSession({
        orderToken: orderToken || `tok_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        photographerId,
        eventId,
        customerName,
        customerEmail,
        customerPhone,
        items,
        appBaseUrl
      });

      res.json(checkoutData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: Access Purchased Photos via Token
  app.get('/api/public/order/:orderToken', (req, res) => {
    try {
      const { orderToken } = req.params;
      const order = db.getOrderByToken(orderToken);

      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }

      // Format clean item downloads list
      const purchasedPhotos = order.items.map(item => {
        const fullPhoto = db.getPhotoById(item.photoId);
        return {
          id: item.photoId,
          photoNumber: item.photoNumber,
          price: item.price,
          downloadUrl: `/api/downloads/${orderToken}/${item.photoId}`,
          filename: fullPhoto?.filename || `foto_${item.photoNumber}.jpg`
        };
      });

      res.json({
        order: {
          id: order.id,
          orderToken: order.orderToken,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          eventName: order.eventName,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus,
          paidAt: order.paidAt,
          photos: purchasedPhotos
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Protected High-Res Photo Download Route (Validates PAID Order Status)
  app.get('/api/downloads/:orderToken/:photoId', (req, res) => {
    try {
      const { orderToken, photoId } = req.params;
      const order = db.getOrderByToken(orderToken);

      if (!order || order.paymentStatus !== 'PAID') {
        return res.status(403).send('Acesso não autorizado. Pagamento pendente ou pedido inválido.');
      }

      const item = order.items.find(i => i.photoId === photoId);
      if (!item) {
        return res.status(404).send('Foto não pertence a este pedido.');
      }

      const photo = db.getPhotoById(photoId);
      if (!photo) {
        return res.status(404).send('Fotografia não encontrada.');
      }

      // If original image is base64 data URI, send it as clean image file download without watermark
      if (photo.originalPath.startsWith('data:')) {
        const matches = photo.originalPath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const type = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', type);
          res.setHeader('Content-Disposition', `attachment; filename="${photo.filename || `foto_${photo.photoNumber}.jpg`}"`);
          return res.send(buffer);
        }
      }

      // Fallback
      res.redirect(photo.originalPath);
    } catch (err: any) {
      res.status(500).send('Erro ao processar download.');
    }
  });

  // -------------------------------------------------------------
  // STRIPE CONNECT & BILLING SUBSCRIPTIONS
  // -------------------------------------------------------------

  // Stripe Connect Onboarding Link
  app.post('/api/stripe/connect/onboard', requireAuth, async (req: any, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const appBaseUrl = `${protocol}://${host}`;

      const link = await StripeService.createConnectAccountLink(req.user.id, appBaseUrl);
      res.json(link);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upgrade to Pro Subscription via Card (R$ 97,90/mês)
  app.post('/api/stripe/subscription/process-card', requireAuth, async (req: any, res) => {
    try {
      const { cardNumber, cardHolder, cardExp, cardCvc } = req.body;
      const result = await StripeService.processCardSubscriptionPayment(req.user.id, {
        cardNumber,
        cardHolder,
        cardExp,
        cardCvc
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Falha ao processar pagamento com cartão.' });
    }
  });

  // Upgrade to Pro Subscription via Stripe Checkout Session (R$ 97,90/mês)
  app.post('/api/stripe/subscription/pro', requireAuth, async (req: any, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const appBaseUrl = `${protocol}://${host}`;

      const session = await StripeService.createProSubscriptionSession(req.user.id, appBaseUrl);
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify Stripe Checkout Session on redirect back
  app.post('/api/stripe/subscription/verify-session', requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId é obrigatório.' });
      }
      const result = await StripeService.verifyCheckoutSession(sessionId, req.user.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook Route
  app.post('/api/stripe/webhook', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const result = await StripeService.handleWebhookEvent(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // -------------------------------------------------------------
  // ADMIN API ROUTES
  // -------------------------------------------------------------

  app.get('/api/admin/metrics', requireAdmin, (req, res) => {
    try {
      const metrics = db.getAdminMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/photographers', requireAdmin, (req, res) => {
    try {
      const users = db.getUsers().filter(u => u.role === 'PHOTOGRAPHER');
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // VITE & STATIC SERVING
  // -------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FotoVenda SaaS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
