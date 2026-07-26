import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('device-token')
  registerToken(
    @CurrentUser() user: { userId: string },
    @Body() body: { token: string; platform?: string },
  ) {
    return this.notificationsService.registerDeviceToken(user.userId, body.token, body.platform);
  }

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.listForUser(user.userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.notificationsService.markRead(user.userId, id);
  }
}
