import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveReplay } from '../live/entities/live-replay.entity';
import { LiveSession } from '../live/entities/live-session.entity';

@Injectable()
export class ReplayService {
  constructor(
    @InjectRepository(LiveReplay) private replayRepo: Repository<LiveReplay>,
    @InjectRepository(LiveSession) private liveRepo: Repository<LiveSession>,
  ) {}

  // NOTE ON ACTUAL RECORDING: this service only stores/serves the replay URL — it does not
  // record video itself. Wiring real recording means enabling Agora's Cloud Recording REST API
  // (start recording alongside LiveService.startLive, stop + fetch the resulting file URL
  // alongside LiveService.endLive) and calling `attach()` here once the recording upload
  // finishes. That needs Agora Cloud Recording credentials/config beyond STREAMING_APP_ID —
  // left as a Phase 3 follow-up. For now this endpoint accepts any pre-uploaded video URL,
  // so an external pipeline (or Agora's webhook) can call it directly.
  async attach(hostId: string, liveSessionId: string, videoUrl: string, durationSeconds?: number) {
    const session = await this.liveRepo.findOne({ where: { id: liveSessionId, hostId } });
    if (!session) throw new ForbiddenException('Not the host of this live session');

    const existing = await this.replayRepo.findOne({ where: { liveSessionId } });
    if (existing) {
      existing.videoUrl = videoUrl;
      if (durationSeconds) existing.durationSeconds = durationSeconds;
      return this.replayRepo.save(existing);
    }

    return this.replayRepo.save(this.replayRepo.create({ liveSessionId, videoUrl, durationSeconds }));
  }

  async get(liveSessionId: string) {
    const replay = await this.replayRepo.findOne({ where: { liveSessionId } });
    if (!replay) throw new NotFoundException('No replay available for this live session');

    replay.viewCount += 1;
    await this.replayRepo.save(replay);
    return replay;
  }
}
