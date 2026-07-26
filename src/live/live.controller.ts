import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LiveService } from './live.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('live')
export class LiveController {
  constructor(private liveService: LiveService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  start(
    @CurrentUser() user: { userId: string },
    @Body() body: { title?: string; isPrivate?: boolean; entryFeeCoins?: number },
  ) {
    return this.liveService.startLive(user.userId, body?.title, body?.isPrivate ?? false, body?.entryFeeCoins ?? 0);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.liveService.join(user.userId, id);
  }

  @Post('end')
  @UseGuards(JwtAuthGuard)
  end(@CurrentUser() user: { userId: string }, @Body() body: { sessionId: string }) {
    return this.liveService.endLive(user.userId, body.sessionId);
  }

  @Get('list')
  list() {
    return this.liveService.listLive();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.liveService.getById(id);
  }
}
