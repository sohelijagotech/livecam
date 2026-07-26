import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession, LiveStatus } from '../live/entities/live-session.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { Follow } from '../follow/entities/follow.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LiveSession) private liveRepo: Repository<LiveSession>,
    @InjectRepository(GiftTransaction) private giftTxRepo: Repository<GiftTransaction>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
  ) {}

  async creatorSummary(hostId: string, since?: Date) {
    const liveQb = this.liveRepo
      .createQueryBuilder('ls')
      .where('ls.hostId = :hostId', { hostId })
      .andWhere('ls.status != :liveStatus', { liveStatus: LiveStatus.LIVE }); // only count completed sessions
    if (since) liveQb.andWhere('ls.startedAt >= :since', { since });

    const [totalLiveSessions, avgPeakViewersRow, followerCount] = await Promise.all([
      liveQb.getCount(),
      liveQb
        .clone()
        .select('AVG(ls.peakViewers)', 'avg')
        .getRawOne(),
      this.followRepo.count({ where: { followingId: hostId } }),
    ]);

    const giftQb = this.giftTxRepo
      .createQueryBuilder('gt')
      .where('gt.receiverId = :hostId', { hostId });
    if (since) giftQb.andWhere('gt.createdAt >= :since', { since });

    const [giftStatsRow, giftCount] = await Promise.all([
      giftQb.clone().select('COALESCE(SUM(gt.diamondsCredited), 0)', 'totalDiamonds').getRawOne(),
      giftQb.clone().getCount(),
    ]);

    return {
      totalLiveSessions,
      averagePeakViewers: Math.round(Number(avgPeakViewersRow?.avg) || 0),
      followerCount,
      totalDiamondsEarned: Number(giftStatsRow?.totalDiamonds) || 0,
      totalGiftsReceived: giftCount,
    };
  }

  async liveSessionHistory(hostId: string, limit = 50) {
    return this.liveRepo.find({
      where: { hostId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }
}
