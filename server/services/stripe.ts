import Stripe from 'stripe';
import { db, calculatePlatformFee } from '../db.js';
import { APP_CONFIG } from '../../src/config/index.js';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia' as any
    });
  }
  return stripeClient;
}

export class StripeService {
  /**
   * Initiates Stripe Connect onboarding account link for a photographer.
   */
  static async createConnectAccountLink(userId: string, appBaseUrl: string) {
    const user = db.getUserById(userId);
    if (!user) throw new Error('Fotógrafo não encontrado');

    const stripe = getStripe();
    if (stripe) {
      // Real Stripe Connect Account creation
      let accountId = user.stripeAccountId;
      if (!accountId || accountId.startsWith('acct_Demo')) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'BR',
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          business_profile: {
            name: user.name,
            mcc: '7395' // Photo finishing / Photographers
          }
        });
        accountId = account.id;
        db.updateUser(userId, { stripeAccountId: accountId, stripeAccountStatus: 'PENDING' });
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appBaseUrl}/dashboard/stripe?refresh=true`,
        return_url: `${appBaseUrl}/dashboard/stripe?success=true`,
        type: 'account_onboarding'
      });

      return { url: accountLink.url, accountId };
    } else {
      // Sandbox simulation mode
      const mockAccountId = user.stripeAccountId || `acct_Connect_${Math.random().toString(36).substring(2, 9)}`;
      db.updateUser(userId, { stripeAccountId: mockAccountId, stripeAccountStatus: 'VERIFIED' });
      return {
        url: `${appBaseUrl}/dashboard/stripe?success=true&mock=true`,
        accountId: mockAccountId
      };
    }
  }

  /**
   * Creates a Checkout Session for purchasing selected photos in an event.
   */
  static async createPhotoCheckoutSession(params: {
    orderToken: string;
    photographerId: string;
    eventId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: Array<{ photoId: string; photoNumber: string; price: number; previewUrl: string }>;
    appBaseUrl: string;
  }) {
    const photographer = db.getUserById(params.photographerId);
    if (!photographer) throw new Error('Fotógrafo não encontrado');

    const event = db.getEventById(params.eventId);
    if (!event) throw new Error('Evento não encontrado');

    const grossTotal = params.items.reduce((sum, item) => sum + item.price, 0);
    const fees = calculatePlatformFee(grossTotal, photographer.plan);

    // Save order in database as PENDING
    const order = db.addOrder({
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderToken: params.orderToken,
      photographerId: photographer.id,
      photographerName: photographer.name,
      eventId: event.id,
      eventName: event.name,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      totalAmount: grossTotal,
      platformFeeAmount: fees.platformFeeAmount,
      photographerPayoutAmount: fees.photographerPayoutAmount,
      stripeFeeEstimate: fees.stripeFeeEstimate,
      paymentStatus: 'PENDING',
      items: params.items.map((it, idx) => ({
        id: `ord_item_${idx + 1}_${Math.random().toString(36).substring(2, 5)}`,
        orderId: '', // populated after creation
        photoId: it.photoId,
        photoNumber: it.photoNumber,
        price: it.price,
        previewUrl: it.previewUrl
      })),
      createdAt: new Date().toISOString()
    });

    const stripe = getStripe();
    if (stripe) {
      // Build Stripe line items
      const lineItems = params.items.map(item => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Fotografia #${item.photoNumber} - ${event.name}`,
            description: `Foto digital em alta resolução de ${photographer.name}`,
            images: [item.previewUrl]
          },
          unit_amount: Math.round(item.price * 100) // em centavos
        },
        quantity: 1
      }));

      // Create Stripe Checkout Session with Application Fee Amount if Stripe Connect is used
      const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: params.customerEmail,
        success_url: `${params.appBaseUrl}/compra/sucesso/${params.orderToken}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${params.appBaseUrl}/f/${event.photographerSlug}/${event.slug}?cancelled=true`,
        metadata: {
          orderToken: params.orderToken,
          orderId: order.id,
          photographerId: photographer.id,
          eventId: event.id
        }
      };

      // If photographer has connected Stripe account and platform fee applies
      if (photographer.stripeAccountId && photographer.stripeAccountStatus === 'VERIFIED') {
        sessionCreateParams.payment_intent_data = {
          application_fee_amount: Math.round(fees.platformFeeAmount * 100),
          transfer_data: {
            destination: photographer.stripeAccountId
          }
        };
      }

      const session = await stripe.checkout.sessions.create(sessionCreateParams);

      db.updateOrder(order.id, {
        stripeCheckoutSessionId: session.id
      });

      return {
        checkoutUrl: session.url,
        orderToken: params.orderToken,
        orderId: order.id,
        isMock: false
      };
    } else {
      // Sandbox / Preview immediate completion option
      db.updateOrder(order.id, {
        paymentStatus: 'PAID',
        paidAt: new Date().toISOString()
      });

      return {
        checkoutUrl: `${params.appBaseUrl}/compra/sucesso/${params.orderToken}?mock=true`,
        orderToken: params.orderToken,
        orderId: order.id,
        isMock: true
      };
    }
  }

  /**
   * Creates a Stripe Subscription Session for upgrading to PRO plan (R$ 97,90/mês)
   */
  static async createProSubscriptionSession(userId: string, appBaseUrl: string) {
    const user = db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const stripe = getStripe();
    if (stripe) {
      const priceId = process.env.STRIPE_PRO_PRICE_ID;
      
      const lineItem = priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: 'brl',
              product_data: {
                name: 'DPhoto Pro - Plano Fotógrafo',
                description: 'Assinatura mensal DPhoto (Fotos e Eventos ilimitados + 5% de comissão)',
              },
              unit_amount: 9790, // R$ 97,90
              recurring: {
                interval: 'month' as const
              }
            },
            quantity: 1
          };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: user.email,
        line_items: [lineItem],
        success_url: `${appBaseUrl}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBaseUrl}/dashboard?subscription=cancelled`,
        metadata: {
          userId: user.id
        }
      });

      return { url: session.url, isMock: false };
    } else {
      // Instant Upgrade in Sandbox Mode
      db.updateUser(userId, { plan: 'PRO' });
      db.addSubscription({
        id: `sub_${Date.now()}`,
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString()
      });

      return {
        url: `${appBaseUrl}/dashboard?subscription=success_mock`,
        isMock: true
      };
    }
  }

  /**
   * Processes Stripe Webhooks safely with idempotency checks.
   */
  static async handleWebhookEvent(rawBody: Buffer, signature: string) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      console.log('Stripe or Webhook secret not configured. Skipping webhook verification.');
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    // Idempotency check
    if (db.isWebhookProcessed(event.id)) {
      console.log(`Webhook event ${event.id} already processed.`);
      return { received: true, idempotent: true };
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderToken = session.metadata?.orderToken;
        const userId = session.metadata?.userId;

        if (orderToken) {
          const order = db.getOrderByToken(orderToken);
          if (order) {
            db.updateOrder(order.id, {
              paymentStatus: 'PAID',
              paidAt: new Date().toISOString(),
              stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
            });
          }
        } else if (userId) {
          // User Subscription Checkout
          db.updateUser(userId, { plan: 'PRO' });
          db.addSubscription({
            id: `sub_${session.subscription || Date.now()}`,
            userId: userId,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false,
            createdAt: new Date().toISOString()
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          db.updateUser(userId, { plan: 'FREE' });
        }
        break;
      }
    }

    db.markWebhookProcessed(event.id, event.type);
    return { received: true };
  }
}
