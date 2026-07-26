import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CoinPackagesService } from '../coin-packages/coin-packages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CoinPackage } from '../coin-packages/entities/coin-package.entity';

@Controller('admin/coin-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCoinPackagesController {
  constructor(private service: CoinPackagesService) {}

  @Get()
  listAll() {
    return this.service.listAll();
  }

  @Post()
  create(@Body() body: Partial<CoinPackage>) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<CoinPackage>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
