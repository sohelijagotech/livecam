import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VipMembership } from './entities/vip-membership.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';
import { VIP_TIERS, VIP_MEMBERSHIP_DURATION_DAYS } from './vip-tiers.config';

@Injectable()
export class VipService {
  constructor(
    @InjectRepository(VipMembership) private vipRepo: Repository<VipMembership>,
    private dataSource: DataSource,
  ) {}

  listTiers() {
    return VIP_TIERS;
  }

  async getStatus(userId: string) {
    const membership = await this.vipRepo.findOne({ where: { userId } });
    if (!membership || !membership.expiresAt || membership.expiresAt < new Date()) {
      return { level: 0, active: false, expiresAt: null };
    }
    return { level: membership.level, active: true, expiresAt: membership.expiresAt };
  }

  async purchase(userId: string, level: number) {
    const tier = VIP_TIERS.find((t) => t.level === level);
    if (!tier) throw new BadRequestException('Invalid VIP level');

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, { where: { user: { id: userId } } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (Number(wallet.coinBalance) < tier.coinPrice) {
        throw new BadRequestException('Insufficient coin balance');
      }

      wallet.coinBalance = Number(wallet.coinBalance) - tier.coinPrice;
      await manager.save(wallet);

      await manager.save(
        manager.create(Transaction, {
          user: { id: userId } as any,
          type: TransactionType.GIFT_SENT, // reuses the generic coin-debit type; consider a dedicated VIP_PURCHASE type later
          amount: -tier.coinPrice,
          currency: 'coin',
          metadata: { reason: 'vip_purchase', level },
        }),
      );

      let membership = await manager.findOne(VipMembership, { where: { userId } });
      const now = new Date();
      const baseDate = membership?.expiresAt && membership.expiresAt > now ? membership.expiresAt : now;
      const expiresAt = new Date(baseDate.getTime() + VIP_MEMBERSHIP_DURATION_DAYS * 24 * 60 * 60 * 1000);

      if (!membership) {
        membership = manager.create(VipMembership, { userId, level, expiresAt });
      } else {
        membership.level = level; // Phase 1: buying any tier resets to that tier's level (no partial upgrades)
        membership.expiresAt = expiresAt;
      }
      return manager.save(membership);
    });
  }
}
