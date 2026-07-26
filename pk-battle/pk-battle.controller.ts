import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PkBattleService } from './pk-battle.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('pk')
@UseGuards(JwtAuthGuard)
export class PkBattleController {
  constructor(private pkBattleService: PkBattleService) {}

  @Post('invite')
  invite(@CurrentUser() user: { userId: string }, @Body() body: { targetHostId: string }) {
    return this.pkBattleService.invite(user.userId, body.targetHostId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.pkBattleService.accept(id, user.userId);
  }

  @Post(':id/decline')
  decline(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.pkBattleService.decline(id, user.userId);
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.pkBattleService.getStatus(id);
  }

  @Post(':id/end')
  end(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.pkBattleService.end(id, user.userId);
  }
}
