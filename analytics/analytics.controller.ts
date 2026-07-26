import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics/creator')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(@CurrentUser() user: { userId: string }, @Query('since') since?: string) {
    return this.analyticsService.creatorSummary(user.userId, since ? new Date(since) : undefined);
  }

  @Get('history')
  history(@CurrentUser() user: { userId: string }) {
    return this.analyticsService.liveSessionHistory(user.userId);
  }
}
