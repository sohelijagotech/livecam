import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('agency')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private agencyService: AgencyService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() body: { name: string; commissionRate?: number }) {
    return this.agencyService.create(user.userId, body.name, body.commissionRate);
  }

  @Post(':id/invite-host')
  inviteHost(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() body: { hostUserId: string }) {
    return this.agencyService.inviteHost(user.userId, id, body.hostUserId);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.agencyService.acceptInvite(user.userId, id);
  }

  @Post(':id/leave')
  leave(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.agencyService.leaveAgency(user.userId, id);
  }

  @Delete(':id/hosts/:hostUserId')
  removeHost(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Param('hostUserId') hostUserId: string,
  ) {
    return this.agencyService.removeHost(user.userId, id, hostUserId);
  }

  @Get(':id/hosts')
  hosts(@Param('id') id: string) {
    return this.agencyService.listHosts(id);
  }

  @Get(':id/dashboard')
  dashboard(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Query('since') since?: string) {
    return this.agencyService.dashboard(user.userId, id, since ? new Date(since) : undefined);
  }
}
