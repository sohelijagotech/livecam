import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LuckyWheelSpin } from './entities/lucky-wheel-spin.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';
import { WHEEL_PRIZES, PAID_SPIN_COST_COINS, drawPrize } from './wheel-prizes.config';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class LuckyWheelService {
  constructor(
    @InjectRepository(LuckyWheelSpin) private spinRepo: Repository<LuckyWheelSpin>,
    private dataSource: DataSource,
  ) {}

  getPrizeTable() {
    return { prizes: WHEEL_PRIZES, paidSpinCost: PAID_SPIN_COST_COINS };
  }

  async getStatus(userId: string) {
    const today = todayDateString();
    const freeSpinUsed = await this.spinRepo.exists({ where: { userId, spinDate: today, wasFreeSpin: true } });
    return { freeSpinAvailable: !freeSpinUsed, paidSpinCost: PAID_SPIN_COST_COINS };
  }

  // NOTE: Phase 1 limitation — two simultaneous free-spin requests from the same user could
  // both pass the freeSpinUsed check before either write commits. Low-risk for a single-device
  // client, but add a partial unique index on (userId, spinDate) WHERE wasFreeSpin = true
  // before this sees production traffic.
  async spin(userId: string) {
    const today = todayDateString();

    return this.dataSource.transaction(async (manager) => {
      const freeSpinUsed = await manager.exists(LuckyWheelSpin, { where: { userId, spinDate: today, wasFreeSpin: true } });
      const wallet = await manager.findOne(Wallet, { where: { user: { id: userId } } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const isFree = !freeSpinUsed;
      if (!isFree) {
        if (Number(wallet.coinBalance) < PAID_SPIN_COST_COINS) {
          throw new BadRequestException('Insufficient coins for a paid spin');
        }
        wallet.coinBalance = Number(wallet.coinBalance) - PAID_SPIN_COST_COINS;
      }

      const prize = drawPrize();
      wallet.coinBalance = Number(wallet.coinBalance) + prize.coins;
      await manager.save(wallet);

      if (!isFree) {
        await manager.save(
          manager.create(Transaction, {
            user: { id: userId } as any,
            type: TransactionType.GIFT_SENT,
            amount: -PAID_SPIN_COST_COINS,
            currency: 'coin',
            metadata: { reason: 'lucky_wheel_paid_spin' },
          }),
        );
      }
      await manager.save(
        manager.create(Transaction, {
          user: { id: userId } as any,
          type: TransactionType.ADMIN_ADJUSTMENT, // generic credit type; consider a dedicated LUCKY_WHEEL_WIN type later
          amount: prize.coins,
          currency: 'coin',
          metadata: { reason: 'lucky_wheel_win' },
        }),
      );

      const spin = manager.create(LuckyWheelSpin, {
        userId,
        coinsWon: prize.coins,
        wasFreeSpin: isFree,
        spinDate: today,
      } as any);
      await manager.save(spin);

      return { coinsWon: prize.coins, wasFreeSpin: isFree, newCoinBalance: wallet.coinBalance };
    });
  }
}
