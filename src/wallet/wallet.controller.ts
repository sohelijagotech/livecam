import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  balance(@CurrentUser() user: { userId: string }) {
    return this.walletService.getBalance(user.userId);
  }

  @Get('history')
  history(@CurrentUser() user: { userId: string }) {
    return this.walletService.getHistory(user.userId);
  }

  // Manual coin credit — for admin support cases only (refunds, goodwill credits, etc).
  // Real purchases go through POST /payments/checkout-session + the Stripe webhook.
  @Post('admin/credit-coins')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminCreditCoins(@Body() body: { userId: string; coinAmount: number; note: string }) {
    return this.walletService.creditCoins(body.userId, body.coinAmount, `admin_manual_${Date.now()}_${body.note}`);
  }
}

