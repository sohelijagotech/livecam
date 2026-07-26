import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember, FamilyMemberStatus } from './entities/family-member.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family) private familyRepo: Repository<Family>,
    @InjectRepository(FamilyMember) private memberRepo: Repository<FamilyMember>,
    @InjectRepository(GiftTransaction) private giftTxRepo: Repository<GiftTransaction>,
    private notificationsService: NotificationsService,
  ) {}

  async create(leaderId: string, name: string, description?: string) {
    const existing = await this.memberRepo.findOne({ where: { userId: leaderId, status: FamilyMemberStatus.ACTIVE } });
    if (existing) throw new BadRequestException('You already belong to a family — leave it first');

    const family = await this.familyRepo.save(this.familyRepo.create({ name, leaderId, description }));
    await this.memberRepo.save(
      this.memberRepo.create({ familyId: family.id, userId: leaderId, status: FamilyMemberStatus.ACTIVE }),
    );
    return family;
  }

  async invite(requesterId: string, familyId: string, targetUserId: string) {
    const family = await this.getOrThrow(familyId);
    if (family.leaderId !== requesterId) throw new ForbiddenException('Only the family leader can invite members');

    const alreadyInFamily = await this.memberRepo.findOne({
      where: { userId: targetUserId, status: FamilyMemberStatus.ACTIVE },
    });
    if (alreadyInFamily) throw new BadRequestException('User already belongs to a family');

    const invite = await this.memberRepo.save(
      this.memberRepo.create({ familyId, userId: targetUserId, status: FamilyMemberStatus.INVITED }),
    );

    await this.notificationsService.notify(
      targetUserId,
      NotificationType.PK_INVITATION, // reusing the generic "invitation" notification type for Phase 1
      'Family Invitation',
      `You've been invited to join "${family.name}"`,
      { familyId },
    );

    return invite;
  }

  async accept(userId: string, familyId: string) {
    const membership = await this.memberRepo.findOne({
      where: { familyId, userId, status: FamilyMemberStatus.INVITED },
    });
    if (!membership) throw new NotFoundException('No pending invitation found');

    membership.status = FamilyMemberStatus.ACTIVE;
    return this.memberRepo.save(membership);
  }

  async leave(userId: string, familyId: string) {
    const membership = await this.memberRepo.findOne({
      where: { familyId, userId, status: FamilyMemberStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('You are not an active member of this family');

    const family = await this.getOrThrow(familyId);
    if (family.leaderId === userId) {
      throw new BadRequestException('The family leader cannot leave — transfer leadership or disband the family');
    }

    membership.status = FamilyMemberStatus.LEFT;
    membership.leftAt = new Date();
    return this.memberRepo.save(membership);
  }

  async removeMember(requesterId: string, familyId: string, targetUserId: string) {
    const family = await this.getOrThrow(familyId);
    if (family.leaderId !== requesterId) throw new ForbiddenException('Only the family leader can remove members');

    const membership = await this.memberRepo.findOne({
      where: { familyId, userId: targetUserId, status: FamilyMemberStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('Member not found');

    membership.status = FamilyMemberStatus.REMOVED;
    membership.leftAt = new Date();
    return this.memberRepo.save(membership);
  }

  async getMembers(familyId: string) {
    return this.memberRepo.find({
      where: { familyId, status: FamilyMemberStatus.ACTIVE },
      relations: ['user'],
    });
  }

  // Ranks active members by diamonds earned (gifts received) — a simple "family power" metric.
  async getLeaderboard(familyId: string) {
    const members = await this.getMembers(familyId);
    const memberIds = members.map((m) => m.userId);
    if (memberIds.length === 0) return [];

    const rows = await this.giftTxRepo
      .createQueryBuilder('gt')
      .select('gt.receiverId', 'userId')
      .addSelect('COALESCE(SUM(gt.diamondsCredited), 0)', 'totalDiamonds')
      .where('gt.receiverId IN (:...memberIds)', { memberIds })
      .groupBy('gt.receiverId')
      .getRawMany();

    const diamondsByUserId = new Map(rows.map((r) => [r.userId, Number(r.totalDiamonds)]));

    return members
      .map((m) => ({
        userId: m.userId,
        displayName: (m as any).user?.displayName,
        avatarUrl: (m as any).user?.avatarUrl,
        totalDiamonds: diamondsByUserId.get(m.userId) || 0,
      }))
      .sort((a, b) => b.totalDiamonds - a.totalDiamonds);
  }

  async getById(familyId: string) {
    return this.getOrThrow(familyId);
  }

  private async getOrThrow(familyId: string) {
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('Family not found');
    return family;
  }
}
