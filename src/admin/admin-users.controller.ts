import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '../users/entities/user.entity';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.search(q || '');
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.usersService.setStatus(id, UserStatus.SUSPENDED);
  }

  @Patch(':id/ban')
  ban(@Param('id') id: string) {
    return this.usersService.setStatus(id, UserStatus.BANNED);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.usersService.setStatus(id, UserStatus.ACTIVE);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.usersService.verifyIdentity(id);
  }
}
