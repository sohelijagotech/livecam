import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';

export type RankingPeriod = 'daily' | 'weekly' | 'all_time';

function periodStartDate(period: RankingPeriod): Date | null {
  const now = new Date();
  if (period === 'daily') {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  return null; // all_time — no lower bound
}

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(GiftTransaction) private giftTxRepo: Repository<GiftTransaction>,
  ) {}

  async topHosts(period: RankingPeriod = 'daily', limit = 50) {
    const qb = this.giftTxRepo
      .createQueryBuilder('gt')
      .innerJoin('gt.receiver', 'receiver')
      .select('receiver.id', 'userId')
      .addSelect('receiver.displayName', 'displayName')
      .addSelect('receiver.avatarUrl', 'avatarUrl')
      .addSelect('SUM(gt.diamondsCredited)', 'totalDiamonds')
      .groupBy('receiver.id')
      .addGroupBy('receiver.displayName')
      .addGroupBy('receiver.avatarUrl')
      .orderBy('"totalDiamonds"', 'DESC')
      .limit(limit);

    const start = periodStartDate(period);
    if (start) qb.where('gt.createdAt >= :start', { start });

    return qb.getRawMany();
  }

  async topSpenders(period: RankingPeriod = 'daily', limit = 50) {
    const qb = this.giftTxRepo
      .createQueryBuilder('gt')
      .innerJoin('gt.sender', 'sender')
      .select('sender.id', 'userId')
      .addSelect('sender.displayName', 'displayName')
      .addSelect('sender.avatarUrl', 'avatarUrl')
      .addSelect('SUM(gt.coinPriceAtSend)', 'totalCoinsSpent')
      .groupBy('sender.id')
      .addGroupBy('sender.displayName')
      .addGroupBy('sender.avatarUrl')
      .orderBy('"totalCoinsSpent"', 'DESC')
      .limit(limit);

    const start = periodStartDate(period);
    if (start) qb.where('gt.createdAt >= :start', { start });

    return qb.getRawMany();
  }
}
