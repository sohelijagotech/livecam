import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { LiveSession, LiveStatus } from './entities/live-session.entity';
import { LiveEntry } from './entities/live-entry.entity';
import { StreamingService } from '../streaming/streaming.service';
import { FollowService } from '../follow/follow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';

@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(LiveSession) private liveRepo: Repository<LiveSession>,
    @InjectRepository(LiveEntry) private entryRepo: Repository<LiveEntry>,
    private streamingService: StreamingService,
    private followService: FollowService,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async startLive(hostId: string, title?: string, isPrivate = false, entryFeeCoins = 0) {
    const existingLive = await this.liveRepo.findOne({
      where: { hostId, status: LiveStatus.LIVE },
    });
    if (existingLive) throw new BadRequestException('You already have an active live session');
    if (entryFeeCoins < 0) throw new BadRequestException('entryFeeCoins cannot be negative');

    const channelName = `live_${hostId}_${randomUUID()}`;
    const session = this.liveRepo.create({ hostId, title, streamChannelName: channelName, isPrivate, entryFeeCoins });
    await this.liveRepo.save(session);

    const { token, appId, expiresAt } = this.streamingService.generateRtcToken(channelName, 'host');

    // Notify followers — fire-and-forget so a slow notification fan-out never delays go-live.
    // Skipped for private lives so they don't leak into a public "X is live" fan-out.
    if (!isPrivate) {
      this.followService.getFollowerIds(hostId).then((followerIds) => {
        followerIds.forEach((followerId) =>
          this.notificationsService.notify(
            followerId,
            NotificationType.LIVE_STARTED,
            'Live Started',
            `${title || 'A host you follow'} just went live`,
            { hostId, sessionId: session.id },
          ),
        );
      });
    }

    return { session, streamToken: token, streamAppId: appId, tokenExpiresAt: expiresAt };
  }

  // Single entry point for viewers: handles free lives, paid entry fees, and idempotent
  // re-entry (already paid once = free to rejoin), then returns an audience-role token.
  // Supersedes calling POST /streaming/join-token directly for live viewing.
  async join(viewerId: string, liveSessionId: string) {
    const session = await this.liveRepo.findOne({ where: { id: liveSessionId, status: LiveStatus.LIVE } });
    if (!session) throw new NotFoundException('Live session not found or has ended');

    if (session.entryFeeCoins > 0) {
      const alreadyPaid = await this.entryRepo.findOne({ where: { liveSessionId, viewerId } });
      if (!alreadyPaid) {
        await this.chargeEntryFee(viewerId, session);
      }
    }

    const { token, appId, uid, expiresAt } = this.streamingService.generateRtcToken(session.streamChannelName, 'audience');
    return { token, appId, uid, channelName: session.streamChannelName, tokenExpiresAt: expiresAt };
  }

  private async chargeEntryFee(viewerId: string, session: LiveSession) {
    if (viewerId === session.hostId) return; // hosts don't pay to view their own live

    await this.dataSource.transaction(async (manager) => {
      const viewerWallet = await manager.findOne(Wallet, { where: { user: { id: viewerId } } });
      if (!viewerWallet) throw new NotFoundException('Wallet not found');
      if (Number(viewerWallet.coinBalance) < session.entryFeeCoins) {
        throw new BadRequestException('Insufficient coins to enter this live');
      }

      const hostWallet = await manager.findOne(Wallet, { where: { user: { id: session.hostId } } });
      if (!hostWallet) throw new NotFoundException("Host's wallet not found");

      viewerWallet.coinBalance = Number(viewerWallet.coinBalance) - session.entryFeeCoins;
      hostWallet.diamondBalance = Number(hostWallet.diamondBalance) + session.entryFeeCoins; // 1:1 coin->diamond for entry fees
      await manager.save(viewerWallet);
      await manager.save(hostWallet);

      await manager.save(
        manager.create(Transaction, {
          user: { id: viewerId } as any,
          type: TransactionType.GIFT_SENT,
          amount: -session.entryFeeCoins,
          currency: 'coin',
          metadata: { reason: 'live_entry_fee', liveSessionId: session.id },
        }),
      );
      await manager.save(
        manager.create(Transaction, {
          user: { id: session.hostId } as any,
          type: TransactionType.GIFT_RECEIVED,
          amount: session.entryFeeCoins,
          currency: 'diamond',
          metadata: { reason: 'live_entry_fee', liveSessionId: session.id, payerId: viewerId },
        }),
      );

      await manager.save(
        manager.create(LiveEntry, { liveSessionId: session.id, viewerId, coinsPaid: session.entryFeeCoins }),
      );
    });
  }

  async endLive(hostId: string, sessionId: string) {
    const session = await this.liveRepo.findOne({ where: { id: sessionId, hostId } });
    if (!session) throw new NotFoundException('Live session not found');

    session.status = LiveStatus.ENDED;
    session.endedAt = new Date();
    return this.liveRepo.save(session);
  }

  async listLive() {
    return this.liveRepo.find({
      where: { status: LiveStatus.LIVE, isPrivate: false },
      relations: ['host'],
      order: { startedAt: 'DESC' },
    });
  }

  // Admin monitoring needs visibility into private/paid lives too — the public listLive()
  // above intentionally hides them from the home feed.
  async listAllLiveForAdmin() {
    return this.liveRepo.find({
      where: { status: LiveStatus.LIVE },
      relations: ['host'],
      order: { startedAt: 'DESC' },
    });
  }

  // --- Admin Panel: Live Monitoring ---

  async emergencyStop(sessionId: string, adminNote?: string) {
    const session = await this.liveRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Live session not found');
    session.status = LiveStatus.STOPPED_BY_ADMIN;
    session.endedAt = new Date();
    // adminNote could be persisted to a moderation_actions/audit table in a later pass.
    return this.liveRepo.save(session);
  }

  async getById(id: string) {
    const session = await this.liveRepo.findOne({ where: { id }, relations: ['host'] });
    if (!session) throw new NotFoundException('Live session not found');
    return session;
  }
}
