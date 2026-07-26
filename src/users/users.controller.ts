import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() body: { displayName?: string; avatarUrl?: string; bio?: string },
  ) {
    return this.usersService.updateProfile(user.userId, body);
  }

  @Get('user/:id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
