import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService, RankingPeriod } from './rankings.service';

@Controller('rankings')
export class RankingsController {
  constructor(private rankingsService: RankingsService) {}

  @Get('hosts')
  hosts(@Query('period') period?: RankingPeriod) {
    return this.rankingsService.topHosts(period || 'daily');
  }

  @Get('spenders')
  spenders(@Query('period') period?: RankingPeriod) {
    return this.rankingsService.topSpenders(period || 'daily');
  }
}
