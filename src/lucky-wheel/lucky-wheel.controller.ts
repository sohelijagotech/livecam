import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LuckyWheelService } from './lucky-wheel.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('lucky-wheel')
@UseGuards(JwtAuthGuard)
export class LuckyWheelController {
  constructor(private wheelService: LuckyWheelService) {}

  @Get('prizes')
  prizes() {
    return this.wheelService.getPrizeTable();
  }

  @Get('status')
  status(@CurrentUser() user: { userId: string }) {
    return this.wheelService.getStatus(user.userId);
  }

  @Post('spin')
  spin(@CurrentUser() user: { userId: string }) {
    return this.wheelService.spin(user.userId);
  }
}
