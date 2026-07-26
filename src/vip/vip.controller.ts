import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { VipService } from './vip.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('vip')
export class VipController {
  constructor(private vipService: VipService) {}

  @Get('tiers')
  tiers() {
    return this.vipService.listTiers();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: { userId: string }) {
    return this.vipService.getStatus(user.userId);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  purchase(@CurrentUser() user: { userId: string }, @Body() body: { level: number }) {
    return this.vipService.purchase(user.userId, body.level);
  }
}
