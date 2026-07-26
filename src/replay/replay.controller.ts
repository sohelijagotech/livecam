import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('live/:liveSessionId/replay')
export class ReplayController {
  constructor(private replayService: ReplayService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  attach(
    @CurrentUser() user: { userId: string },
    @Param('liveSessionId') liveSessionId: string,
    @Body() body: { videoUrl: string; durationSeconds?: number },
  ) {
    return this.replayService.attach(user.userId, liveSessionId, body.videoUrl, body.durationSeconds);
  }

  @Get()
  get(@Param('liveSessionId') liveSessionId: string) {
    return this.replayService.get(liveSessionId);
  }
}
