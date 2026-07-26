import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('my-code')
  myCode(@CurrentUser() user: { userId: string }) {
    return this.referralsService.getMyCode(user.userId);
  }

  @Get('my-referrals')
  myReferrals(@CurrentUser() user: { userId: string }) {
    return this.referralsService.myReferrals(user.userId);
  }
}
