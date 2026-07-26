import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LiveService } from '../live/live.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/live')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLiveController {
  constructor(private liveService: LiveService) {}

  @Get('active')
  active() {
    return this.liveService.listAllLiveForAdmin();
  }

  @Post(':id/emergency-stop')
  emergencyStop(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.liveService.emergencyStop(id, body?.reason);
  }
}
