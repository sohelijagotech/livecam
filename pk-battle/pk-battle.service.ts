import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PkBattle, PkBattleStatus } from './entities/pk-battle.entity';
import { LiveSession, LiveStatus } from '../live/entities/live-session.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

// Reserved for a future scheduled job that auto-ends battles after this many seconds.
// Phase 1 keeps battle length host-controlled (explicit POST /pk/:id/end).
const DEFAULT_BATTLE_DURATION_SECONDS = 180;

@Injectable()
export class PkBattleService {
  constructor(
    @InjectRepository(PkBattle) private battleRepo: Repository<PkBattle>,
    @InjectRepository(LiveSession) private liveRepo: Repository<LiveSession>,
    @InjectRepository(GiftTransaction) private giftTxRepo: Repository<GiftTransaction>,
    private chatGateway: ChatGateway,
    private notificationsService: NotificationsService,
  ) {}

  async invite(hostAId: string, targetHostId: string) {
    if (hostAId === targetHostId) throw new BadRequestException('Cannot PK battle yourself');

    const [sessionA, sessionB] = await Promise.all([
      this.liveRepo.findOne({ where: { hostId: hostAId, status: LiveStatus.LIVE } }),
      this.liveRepo.findOne({ where: { hostId: targetHostId, status: LiveStatus.LIVE } }),
    ]);
    if (!sessionA) throw new BadRequestException('You must be live to start a PK battle');
    if (!sessionB) throw new BadRequestException('That host is not currently live');

    const battle = this.battleRepo.create({
      hostAId,
      hostBId: targetHostId,
      liveSessionAId: sessionA.id,
      liveSessionBId: sessionB.id,
      status: PkBattleStatus.PENDING,
    });
    const saved = await this.battleRepo.save(battle);

    await this.notificationsService.notify(
      targetHostId,
      NotificationType.PK_INVITATION,
      'PK Battle Invitation',
      'Another host has challenged you to a PK battle',
      { battleId: saved.id, challengerId: hostAId },
    );

    return saved;
  }

  async accept(battleId: string, respondingHostId: string) {
    const battle = await this.getOrThrow(battleId);
    if (battle.hostBId !== respondingHostId) throw new ForbiddenException('Not your invitation to accept');
    if (battle.status !== PkBattleStatus.PENDING) throw new BadRequestException('Invitation is no longer pending');

    battle.status = PkBattleStatus.LIVE;
    battle.startedAt = new Date();
    const saved = await this.battleRepo.save(battle);

    this.chatGateway.broadcastGift(battle.liveSessionAId, { event: 'pk_battle_started', battleId: battle.id });
    this.chatGateway.broadcastGift(battle.liveSessionBId, { event: 'pk_battle_started', battleId: battle.id });

    return saved;
  }

  async decline(battleId: string, respondingHostId: string) {
    const battle = await this.getOrThrow(battleId);
    if (battle.hostBId !== respondingHostId) throw new ForbiddenException('Not your invitation to decline');
    battle.status = PkBattleStatus.DECLINED;
    return this.battleRepo.save(battle);
  }

  async getStatus(battleId: string) {
    const battle = await this.getOrThrow(battleId);
    const scoreWindStart = battle.startedAt;
    const scoreWindEnd = battle.endedAt || new Date();

    if (!scoreWindStart) {
      return { battle, hostAScore: 0, hostBScore: 0 };
    }

    const [scoreA, scoreB] = await Promise.all([
      this.sumDiamondsInWindow(battle.liveSessionAId, scoreWindStart, scoreWindEnd),
      this.sumDiamondsInWindow(battle.liveSessionBId, scoreWindStart, scoreWindEnd),
    ]);

    return { battle, hostAScore: scoreA, hostBScore: scoreB };
  }

  async end(battleId: string, requestingHostId: string) {
    const battle = await this.getOrThrow(battleId);
    if (battle.hostAId !== requestingHostId && battle.hostBId !== requestingHostId) {
      throw new ForbiddenException('Not a participant in this battle');
    }
    if (battle.status !== PkBattleStatus.LIVE) throw new BadRequestException('Battle is not live');

    battle.endedAt = new Date();
    const { hostAScore, hostBScore } = await this.getStatus(battleId);
    battle.winnerHostId = hostAScore === hostBScore ? null : hostAScore > hostBScore ? battle.hostAId : battle.hostBId;
    battle.status = PkBattleStatus.ENDED;
    const saved = await this.battleRepo.save(battle);

    const resultPayload = { event: 'pk_battle_ended', battleId: battle.id, hostAScore, hostBScore, winnerHostId: battle.winnerHostId };
    this.chatGateway.broadcastGift(battle.liveSessionAId, resultPayload);
    this.chatGateway.broadcastGift(battle.liveSessionBId, resultPayload);

    return { battle: saved, hostAScore, hostBScore };
  }

  private async sumDiamondsInWindow(liveSessionId: string, start: Date, end: Date): Promise<number> {
    const { total } = await this.giftTxRepo
      .createQueryBuilder('gt')
      .select('COALESCE(SUM(gt.diamondsCredited), 0)', 'total')
      .where('gt.liveSessionId = :liveSessionId', { liveSessionId })
      .andWhere('gt.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();
    return Number(total);
  }

  private async getOrThrow(battleId: string) {
    const battle = await this.battleRepo.findOne({ where: { id: battleId } });
    if (!battle) throw new NotFoundException('PK battle not found');
    return battle;
  }
}
