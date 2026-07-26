import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    private notificationsService: NotificationsService,
  ) {}

  async getBalance(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { user: { id: userId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { coinBalance: wallet.coinBalance, diamondBalance: wallet.diamondBalance };
  }

  // Phase 1: called after a payment provider webhook confirms a successful purchase.
  // `referenceId` should be the payment provider's unique transaction/session id — used
  // here to guarantee idempotency if the provider retries the webhook.
  async creditCoins(userId: string, coinAmount: number, referenceId: string) {
    const alreadyProcessed = await this.txRepo.findOne({ where: { referenceId, type: TransactionType.COIN_PURCHASE } });
    if (alreadyProcessed) return this.getBalance(userId);

    const wallet = await this.walletRepo.findOne({ where: { user: { id: userId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    wallet.coinBalance = Number(wallet.coinBalance) + coinAmount;
    await this.walletRepo.save(wallet);

    const tx = this.txRepo.create({
      user: { id: userId } as any,
      type: TransactionType.COIN_PURCHASE,
      amount: coinAmount,
      currency: 'coin',
      referenceId,
    });
    await this.txRepo.save(tx);

    await this.notificationsService.notify(
      userId,
      NotificationType.COINS_PURCHASED,
      'Coins Purchased',
      `${coinAmount} coins added to your wallet`,
    );

    return this.getBalance(userId);
  }

  async getHistory(userId: string) {
    return this.txRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
