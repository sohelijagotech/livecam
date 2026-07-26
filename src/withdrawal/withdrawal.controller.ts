import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('withdrawal')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private withdrawalService: WithdrawalService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: { diamondAmount: number; payoutDetails: Record<string, any> },
  ) {
    return this.withdrawalService.createRequest(user.userId, body.diamondAmount, body.payoutDetails);
  }

  @Get('history')
  history(@CurrentUser() user: { userId: string }) {
    return this.withdrawalService.getHistory(user.userId);
  }

  @Get(':id/status')
  status(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.withdrawalService.getStatus(id, user.userId);
  }
}
