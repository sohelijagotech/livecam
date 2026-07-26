import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FamilyService } from './family.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('family')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private familyService: FamilyService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() body: { name: string; description?: string }) {
    return this.familyService.create(user.userId, body.name, body.description);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.familyService.getById(id);
  }

  @Post(':id/invite')
  invite(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() body: { targetUserId: string }) {
    return this.familyService.invite(user.userId, id, body.targetUserId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.familyService.accept(user.userId, id);
  }

  @Post(':id/leave')
  leave(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.familyService.leave(user.userId, id);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.familyService.removeMember(user.userId, id, targetUserId);
  }

  @Get(':id/members')
  members(@Param('id') id: string) {
    return this.familyService.getMembers(id);
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string) {
    return this.familyService.getLeaderboard(id);
  }
}
