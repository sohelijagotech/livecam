import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

// Phase 1 fixed conversion rate. Move to a configurable admin-managed rate table later.
const DIAMOND_TO_FIAT_RATE = 0.01; // 1 diamond = $0.01

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(Withdrawal) private withdrawalRepo: Repository<Withdrawal>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async createRequest(userId: string, diamondAmount: number, payoutDetails: Record<string, any>) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, { where: { user: { id: userId } } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (Number(wallet.diamondBalance) < diamondAmount) {
        throw new BadRequestException('Insufficient diamond balance');
      }

      wallet.diamondBalance = Number(wallet.diamondBalance) - diamondAmount;
      await manager.save(wallet);

      await manager.save(
        manager.create(Transaction, {
          user: { id: userId } as any,
          type: TransactionType.WITHDRAWAL,
          amount: -diamondAmount,
          currency: 'diamond',
        }),
      );

      const withdrawal = manager.create(Withdrawal, {
        user: { id: userId } as any,
        diamondAmount,
        fiatAmount: Number((diamondAmount * DIAMOND_TO_FIAT_RATE).toFixed(2)),
        payoutDetails,
        status: WithdrawalStatus.PENDING,
      });
      return manager.save(withdrawal);
    });
  }

  async getHistory(userId: string) {
    return this.withdrawalRepo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async getStatus(id: string, userId: string) {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id, user: { id: userId } } });
    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
    return withdrawal;
  }

  // Used by the Admin Panel (Finance section) to approve/reject/mark-paid.
  async updateStatus(id: string, status: WithdrawalStatus, adminNote?: string) {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id }, relations: ['user'] });
    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
    withdrawal.status = status;
    if (adminNote) withdrawal.adminNote = adminNote;
    const saved = await this.withdrawalRepo.save(withdrawal);

    if (status === WithdrawalStatus.APPROVED) {
      await this.notificationsService.notify(
        withdrawal.user.id,
        NotificationType.WITHDRAWAL_APPROVED,
        'Withdrawal Approved',
        `Your withdrawal of ${withdrawal.diamondAmount} diamonds ($${withdrawal.fiatAmount}) was approved`,
      );
    }

    return saved;
  }
}
