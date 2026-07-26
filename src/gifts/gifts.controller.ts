import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GiftsService } from './gifts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('gifts')
export class GiftsController {
  constructor(private giftsService: GiftsService) {}

  @Get('list')
  list() {
    return this.giftsService.listGifts();
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  send(
    @CurrentUser() user: { userId: string },
    @Body() body: { receiverId: string; giftId: string; liveSessionId?: string },
  ) {
    return this.giftsService.sendGift(user.userId, body.receiverId, body.giftId, body.liveSessionId);
  }
}
