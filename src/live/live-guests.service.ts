import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveGuest, LiveGuestStatus, MAX_GUESTS_PER_SESSION } from './entities/live-guest.entity';
import { LiveSession } from './entities/live-session.entity';
import { StreamingService } from '../streaming/streaming.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class LiveGuestsService {
  constructor(
    @InjectRepository(LiveGuest) private guestRepo: Repository<LiveGuest>,
    @InjectRepository(LiveSession) private liveRepo: Repository<LiveSession>,
    private streamingService: StreamingService,
    private chatGateway: ChatGateway,
  ) {}

  async invite(hostId: string, liveSessionId: string, guestUserId: string) {
    const session = await this.liveRepo.findOne({ where: { id: liveSessionId, hostId } });
    if (!session) throw new NotFoundException('Live session not found or you are not the host');

    const activeCount = await this.guestRepo.count({ where: { liveSessionId, status: LiveGuestStatus.JOINED } });
    if (activeCount >= MAX_GUESTS_PER_SESSION) throw new BadRequestException('Guest slots are full');

    const existing = await this.guestRepo.findOne({
      where: { liveSessionId, guestId: guestUserId, status: LiveGuestStatus.INVITED },
    });
    if (existing) return existing;

    const invite = this.guestRepo.create({ liveSessionId, guestId: guestUserId, status: LiveGuestStatus.INVITED });
    const saved = await this.guestRepo.save(invite);

    this.chatGateway.broadcastGift(liveSessionId, { event: 'guest_invited', guestId: guestUserId });
    return saved;
  }

  async accept(guestUserId: string, inviteId: string) {
    const invite = await this.guestRepo.findOne({ where: { id: inviteId, guestId: guestUserId } });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.status !== LiveGuestStatus.INVITED) throw new BadRequestException('Invitation is no longer valid');

    const session = await this.liveRepo.findOne({ where: { id: invite.liveSessionId } });
    if (!session) throw new NotFoundException('Live session not found');

    invite.status = LiveGuestStatus.JOINED;
    await this.guestRepo.save(invite);

    // Guests join the SAME Agora channel as the host, as an additional publisher.
    const { token, appId, expiresAt } = this.streamingService.generateRtcToken(session.streamChannelName, 'host');

    this.chatGateway.broadcastGift(invite.liveSessionId, { event: 'guest_joined', guestId: guestUserId });

    return { invite, streamToken: token, streamAppId: appId, channelName: session.streamChannelName, tokenExpiresAt: expiresAt };
  }

  async leave(guestUserId: string, liveSessionId: string) {
    const guest = await this.guestRepo.findOne({
      where: { liveSessionId, guestId: guestUserId, status: LiveGuestStatus.JOINED },
    });
    if (!guest) throw new NotFoundException('You are not an active guest in this session');

    guest.status = LiveGuestStatus.LEFT;
    guest.leftAt = new Date();
    await this.guestRepo.save(guest);

    this.chatGateway.broadcastGift(liveSessionId, { event: 'guest_left', guestId: guestUserId });
    return { message: 'Left the live session' };
  }

  async remove(hostId: string, liveSessionId: string, guestUserId: string) {
    const session = await this.liveRepo.findOne({ where: { id: liveSessionId, hostId } });
    if (!session) throw new ForbiddenException('Not the host of this live session');

    const guest = await this.guestRepo.findOne({
      where: { liveSessionId, guestId: guestUserId, status: LiveGuestStatus.JOINED },
    });
    if (!guest) throw new NotFoundException('Guest not found in this session');

    guest.status = LiveGuestStatus.REMOVED;
    guest.leftAt = new Date();
    await this.guestRepo.save(guest);

    this.chatGateway.broadcastGift(liveSessionId, { event: 'guest_removed', guestId: guestUserId });
    return { message: 'Guest removed' };
  }

  async listActiveGuests(liveSessionId: string) {
    return this.guestRepo.find({
      where: { liveSessionId, status: LiveGuestStatus.JOINED },
      relations: ['guest'],
    });
  }
}
