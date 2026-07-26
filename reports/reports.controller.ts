import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportStatus, ReportTargetType } from './entities/report.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: { targetType: ReportTargetType; targetId: string; reason: string; details?: string },
  ) {
    return this.reportsService.create(user.userId, body.targetType, body.targetId, body.reason, body.details);
  }

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listPending() {
    return this.reportsService.listPending();
  }

  @Patch('admin/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  resolve(@Param('id') id: string, @Body() body: { status: ReportStatus; adminNote?: string }) {
    return this.reportsService.resolve(id, body.status, body.adminNote);
  }
}
