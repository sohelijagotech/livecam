import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from './entities/agency.entity';
import { AgencyHost, AgencyHostStatus } from './entities/agency-host.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency) private agencyRepo: Repository<Agency>,
    @InjectRepository(AgencyHost) private agencyHostRepo: Repository<AgencyHost>,
    @InjectRepository(GiftTransaction) private giftTxRepo: Repository<GiftTransaction>,
    private notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, name: string, commissionRate?: number) {
    return this.agencyRepo.save(
      this.agencyRepo.create({ name, ownerId, commissionRate: commissionRate ?? 10 }),
    );
  }

  async inviteHost(requesterId: string, agencyId: string, hostUserId: string) {
    const agency = await this.getOrThrow(agencyId);
    if (agency.ownerId !== requesterId) throw new ForbiddenException('Only the agency owner can invite hosts');

    const alreadyManaged = await this.agencyHostRepo.findOne({
      where: { hostId: hostUserId, status: AgencyHostStatus.ACTIVE },
    });
    if (alreadyManaged) throw new BadRequestException('Host is already managed by an agency');

    const invite = await this.agencyHostRepo.save(
      this.agencyHostRepo.create({ agencyId, hostId: hostUserId, status: AgencyHostStatus.INVITED }),
    );

    await this.notificationsService.notify(
      hostUserId,
      NotificationType.PK_INVITATION, // reusing the generic "invitation" notification type for Phase 1
      'Agency Invitation',
      `"${agency.name}" invited you to join as a managed host`,
      { agencyId },
    );

    return invite;
  }

  async acceptInvite(hostUserId: string, agencyId: string) {
    const membership = await this.agencyHostRepo.findOne({
      where: { agencyId, hostId: hostUserId, status: AgencyHostStatus.INVITED },
    });
    if (!membership) throw new NotFoundException('No pending invitation found');

    membership.status = AgencyHostStatus.ACTIVE;
    return this.agencyHostRepo.save(membership);
  }

  async leaveAgency(hostUserId: string, agencyId: string) {
    const membership = await this.agencyHostRepo.findOne({
      where: { agencyId, hostId: hostUserId, status: AgencyHostStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('You are not an active host of this agency');

    membership.status = AgencyHostStatus.LEFT;
    membership.leftAt = new Date();
    return this.agencyHostRepo.save(membership);
  }

  async removeHost(requesterId: string, agencyId: string, hostUserId: string) {
    const agency = await this.getOrThrow(agencyId);
    if (agency.ownerId !== requesterId) throw new ForbiddenException('Only the agency owner can remove hosts');

    const membership = await this.agencyHostRepo.findOne({
      where: { agencyId, hostId: hostUserId, status: AgencyHostStatus.ACTIVE },
    });
    if (!membership) throw new NotFoundException('Host not found');

    membership.status = AgencyHostStatus.REMOVED;
    membership.leftAt = new Date();
    return this.agencyHostRepo.save(membership);
  }

  async listHosts(agencyId: string) {
    return this.agencyHostRepo.find({
      where: { agencyId, status: AgencyHostStatus.ACTIVE },
      relations: ['host'],
    });
  }

  // Agency Dashboard: per-host diamond earnings + the agency's commission cut, for a period.
  async dashboard(requesterId: string, agencyId: string, since?: Date) {
    const agency = await this.getOrThrow(agencyId);
    if (agency.ownerId !== requesterId) throw new ForbiddenException('Only the agency owner can view the dashboard');

    const hosts = await this.listHosts(agencyId);
    const hostIds = hosts.map((h) => h.hostId);
    if (hostIds.length === 0) {
      return { agency, hosts: [], totalDiamonds: 0, totalCommissionCoins: 0 };
    }

    const qb = this.giftTxRepo
      .createQueryBuilder('gt')
      .select('gt.receiverId', 'hostId')
      .addSelect('COALESCE(SUM(gt.diamondsCredited), 0)', 'totalDiamonds')
      .where('gt.receiverId IN (:...hostIds)', { hostIds })
      .groupBy('gt.receiverId');
    if (since) qb.andWhere('gt.createdAt >= :since', { since });

    const rows = await qb.getRawMany();
    const diamondsByHostId = new Map(rows.map((r) => [r.hostId, Number(r.totalDiamonds)]));

    const commissionRate = Number(agency.commissionRate) / 100;
    const hostBreakdown = hosts.map((h) => {
      const totalDiamonds = diamondsByHostId.get(h.hostId) || 0;
      return {
        hostId: h.hostId,
        displayName: (h as any).host?.displayName,
        totalDiamonds,
        agencyCommissionDiamonds: Math.round(totalDiamonds * commissionRate),
      };
    });

    const totalDiamonds = hostBreakdown.reduce((sum, h) => sum + h.totalDiamonds, 0);
    const totalCommissionCoins = hostBreakdown.reduce((sum, h) => sum + h.agencyCommissionDiamonds, 0);

    return { agency, hosts: hostBreakdown, totalDiamonds, totalCommissionCoins };
  }

  private async getOrThrow(agencyId: string) {
    const agency = await this.agencyRepo.findOne({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agency not found');
    return agency;
  }
}
