import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private followService: FollowService) {}

  @Post(':id')
  follow(@CurrentUser() user: { userId: string }, @Param('id') targetId: string) {
    return this.followService.follow(user.userId, targetId);
  }

  @Delete(':id')
  unfollow(@CurrentUser() user: { userId: string }, @Param('id') targetId: string) {
    return this.followService.unfollow(user.userId, targetId);
  }

  @Get('followers/:id')
  followers(@Param('id') id: string) {
    return this.followService.getFollowers(id);
  }

  @Get('following/:id')
  following(@Param('id') id: string) {
    return this.followService.getFollowing(id);
  }
}
