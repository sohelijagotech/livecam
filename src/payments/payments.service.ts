import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CoinPackagesService } from '../coin-packages/coin-packages.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private coinPackagesService: CoinPackagesService,
    private walletService: WalletService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') || 'sk_test_placeholder', {
      apiVersion: '2024-06-20',
    });
  }

  // Called by the mobile app before opening the Stripe payment sheet / checkout.
  async createCheckoutSession(userId: string, coinPackageId: string) {
    const packages = await this.coinPackagesService.listAll();
    const pkg = packages.find((p) => p.id === coinPackageId);
    if (!pkg || !pkg.active) throw new NotFoundException('Coin package not found');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${pkg.name} — ${pkg.coinAmount + pkg.bonusCoinAmount} coins` },
            unit_amount: Math.round(Number(pkg.priceUsd) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        coinPackageId: pkg.id,
        coinAmount: String(pkg.coinAmount + pkg.bonusCoinAmount),
      },
      success_url: this.config.get('CHECKOUT_SUCCESS_URL') || 'liveconnect://payment-success',
      cancel_url: this.config.get('CHECKOUT_CANCEL_URL') || 'liveconnect://payment-cancel',
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  // Stripe webhook handler — the single source of truth for crediting coins.
  // Never credit coins directly from a client-reported "success" — always verify server-side.
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, coinAmount } = session.metadata || {};
      if (userId && coinAmount) {
        await this.walletService.creditCoins(userId, parseInt(coinAmount, 10), session.id);
      }
    }

    return { received: true };
  }
}
