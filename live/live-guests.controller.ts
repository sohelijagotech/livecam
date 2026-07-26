import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LiveGuestsService } from './live-guests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('live/:liveSessionId/guests')
@UseGuards(JwtAuthGuard)
export class LiveGuestsController {
  constructor(private liveGuestsService: LiveGuestsService) {}

  @Post('invite')
  invite(
    @CurrentUser() user: { userId: string },
    @Param('liveSessionId') liveSessionId: string,
    @Body() body: { guestUserId: string },
  ) {
    return this.liveGuestsService.invite(user.userId, liveSessionId, body.guestUserId);
  }

  @Post('accept/:inviteId')
  accept(@CurrentUser() user: { userId: string }, @Param('inviteId') inviteId: string) {
    return this.liveGuestsService.accept(user.userId, inviteId);
  }

  @Post('leave')
  leave(@CurrentUser() user: { userId: string }, @Param('liveSessionId') liveSessionId: string) {
    return this.liveGuestsService.leave(user.userId, liveSessionId);
  }

  @Delete(':guestUserId')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('liveSessionId') liveSessionId: string,
    @Param('guestUserId') guestUserId: string,
  ) {
    return this.liveGuestsService.remove(user.userId, liveSessionId, guestUserId);
  }

  @Get()
  list(@Param('liveSessionId') liveSessionId: string) {
    return this.liveGuestsService.listActiveGuests(liveSessionId);
  }
}
