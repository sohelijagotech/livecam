import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';

const REFERRAL_REWARD_COINS = 500; // Phase 2: move to an admin-configurable setting

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  generateCode(): string {
    return randomBytes(4).toString('hex'); // 8-char code, collisions handled by unique constraint + retry at call site
  }

  async findReferrerByCode(code: string): Promise<User | null> {
    if (!code) return null;
    return this.usersRepo.findOne({ where: { referralCode: code } });
  }

  async getMyCode(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { referralCode: user.referralCode };
  }

  // Called once the referred user's phone is verified — rewards the referrer.
  // Idempotent via the unique constraint on referredUserId.
  async rewardReferrerIfEligible(referredUser: User) {
    if (!referredUser.referredByUserId) return null;

    const alreadyRewarded = await this.referralRepo.findOne({ where: { referredUserId: referredUser.id } });
    if (alreadyRewarded) return null;

    return this.dataSource.transaction(async (manager) => {
      const referrerWallet = await manager.findOne(Wallet, { where: { user: { id: referredUser.referredByUserId } } });
      if (!referrerWallet) return null;

      referrerWallet.coinBalance = Number(referrerWallet.coinBalance) + REFERRAL_REWARD_COINS;
      await manager.save(referrerWallet);

      await manager.save(
        manager.create(Transaction, {
          user: { id: referredUser.referredByUserId } as any,
          type: TransactionType.ADMIN_ADJUSTMENT,
          amount: REFERRAL_REWARD_COINS,
          currency: 'coin',
          metadata: { reason: 'referral_reward', referredUserId: referredUser.id },
        }),
      );

      return manager.save(
        manager.create(Referral, {
          referrerId: referredUser.referredByUserId,
          referredUserId: referredUser.id,
          rewardCoins: REFERRAL_REWARD_COINS,
        }),
      );
    });
  }

  async myReferrals(userId: string) {
    return this.referralRepo.find({ where: { referrerId: userId }, order: { createdAt: 'DESC' } });
  }
}
