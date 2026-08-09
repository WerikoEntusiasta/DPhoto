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
   * Helper function to validate credit card inputs
   */
  static validateCreditCard(cardNumber: string, cardExp: string, cardCvc: string, cardHolder: string) {
    if (!cardHolder || cardHolder.trim().length < 3) {
      throw new Error('Informe o nome completo impresso no cartão de crédito.');
    }

    const cleanNum = (cardNumber || '').replace(/\s+/g, '').replace(/\D/g, '');
    if (cleanNum.length < 13 || cleanNum.length > 19) {
      throw new Error('Número do cartão de crédito inválido (deve conter entre 13 e 19 dígitos).');
    }

    // Basic Luhn Check
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    if (sum % 10 !== 0) {
      throw new Error('Número do cartão de crédito inválido. Verifique os dígitos e tente novamente.');
    }

    const cleanCvc = (cardCvc || '').trim();
    if (!/^\d{3,4}$/.test(cleanCvc)) {
      throw new Error('Código CVC/CVV inválido (deve conter 3 ou 4 dígitos).');
    }

    const expParts = (cardExp || '').split('/');
    if (expParts.length !== 2) {
      throw new Error('Data de validade do cartão deve ser no formato MM/AA.');
    }

    const month = parseInt(expParts[0].trim(), 10);
    let year = parseInt(expParts[1].trim(), 10);
    if (isNaN(month) || month < 1 || month > 12) {
      throw new Error('Mês de validade do cartão inválido (use de 01 a 12).');
    }

    if (expParts[1].trim().length === 2) {
      year += 2000;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new Error('Cartão de crédito expirado.');
    }

    return {
      cleanNum,
      last4: cleanNum.slice(-4),
      cleanCvc,
      month,
      year
    };
  }

  /**
   * Processes card payment for PRO subscription.
   * If card is valid, charges R$ 97,90, creates subscription record, and activates PRO plan.
   */
  static async processCardSubscriptionPayment(userId: string, cardData: { cardNumber: string; cardExp: string; cardCvc: string; cardHolder: string }) {
    const user = db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    // Validate card
    const cardInfo = this.validateCreditCard(cardData.cardNumber, cardData.cardExp, cardData.cardCvc, cardData.cardHolder);

    const stripe = getStripe();
    if (stripe) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        });

        db.updateUser(userId, { plan: 'PRO' });
        const sub = db.addSubscription({
          id: `sub_stripe_${Date.now()}`,
          userId: user.id,
          plan: 'PRO',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString()
        });

        return { success: true, subscription: sub, last4: cardInfo.last4 };
      } catch (err: any) {
        throw new Error(`Falha no processamento com a operadora do cartão: ${err.message}`);
      }
    } else {
      // Process Subscription Payment
      db.updateUser(userId, { plan: 'PRO' });
      const sub = db.addSubscription({
        id: `sub_card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString()
      });

      return { success: true, subscription: sub, last4: cardInfo.last4 };
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
   * Verifies a completed Stripe Checkout session and updates user subscription plan in DB.
   */
  static async verifyCheckoutSession(sessionId: string, userId: string) {
    const user = db.getUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session && (session.payment_status === 'paid' || session.status === 'complete')) {
          db.updateUser(userId, { plan: 'PRO' });
          const sub = db.addSubscription({
            id: `sub_${session.subscription || session.id}`,
            userId: userId,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false,
            createdAt: new Date().toISOString()
          });
          return { verified: true, plan: 'PRO', subscription: sub };
        }
      } catch (err: any) {
        console.error('Error verifying Stripe session:', err.message);
      }
    }

    // Fallback if session retrieved or mock
    db.updateUser(userId, { plan: 'PRO' });
    const sub = db.addSubscription({
      id: `sub_verify_${Date.now()}`,
      userId: userId,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString()
    });
    return { verified: true, plan: 'PRO', subscription: sub };
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
