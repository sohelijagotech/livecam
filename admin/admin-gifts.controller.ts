import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GiftsService } from '../gifts/gifts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Gift } from '../gifts/entities/gift.entity';

@Controller('admin/gifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminGiftsController {
  constructor(private giftsService: GiftsService) {}

  @Get()
  listAll() {
    return this.giftsService.listAllGifts();
  }

  @Post()
  create(@Body() body: Partial<Gift>) {
    return this.giftsService.createGift(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Gift>) {
    return this.giftsService.updateGift(id, body);
  }
}
