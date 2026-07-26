import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawalService } from '../withdrawal/withdrawal.service';
import { Withdrawal, WithdrawalStatus } from '../withdrawal/entities/withdrawal.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFinanceController {
  constructor(
    private withdrawalService: WithdrawalService,
    @InjectRepository(Withdrawal) private withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  ) {}

  @Get('withdrawals')
  listWithdrawals() {
    return this.withdrawalRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  @Patch('withdrawals/:id/approve')
  approve(@Param('id') id: string, @Body() body: { adminNote?: string }) {
    return this.withdrawalService.updateStatus(id, WithdrawalStatus.APPROVED, body?.adminNote);
  }

  @Patch('withdrawals/:id/reject')
  reject(@Param('id') id: string, @Body() body: { adminNote?: string }) {
    return this.withdrawalService.updateStatus(id, WithdrawalStatus.REJECTED, body?.adminNote);
  }

  @Patch('withdrawals/:id/paid')
  markPaid(@Param('id') id: string, @Body() body: { adminNote?: string }) {
    return this.withdrawalService.updateStatus(id, WithdrawalStatus.PAID, body?.adminNote);
  }

  @Get('coin-sales')
  coinSales() {
    return this.txRepo.find({
      where: { type: TransactionType.COIN_PURCHASE },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
