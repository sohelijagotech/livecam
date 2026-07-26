import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { LiveSession, LiveStatus } from '../live/entities/live-session.entity';
import { Withdrawal, WithdrawalStatus } from '../withdrawal/entities/withdrawal.entity';
import { Transaction, TransactionType } from '../wallet/entities/transaction.entity';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(LiveSession) private liveRepo: Repository<LiveSession>,
    @InjectRepository(Withdrawal) private withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
  ) {}

  @Get('overview')
  async overview() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [totalUsers, activeLives, pendingWithdrawals, todaysCoinPurchases] = await Promise.all([
      this.usersRepo.count(),
      this.liveRepo.count({ where: { status: LiveStatus.LIVE } }),
      this.withdrawalRepo.count({ where: { status: WithdrawalStatus.PENDING } }),
      this.txRepo.find({
        where: {
          type: TransactionType.COIN_PURCHASE,
          createdAt: Between(startOfDay, endOfDay),
        },
      }),
    ]);

    const todaysCoinSalesVolume = todaysCoinPurchases.reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      totalUsers,
      activeLives,
      pendingWithdrawals,
      todaysCoinSalesVolume, // in coins — join with coin_packages pricing to get fiat revenue
      todaysCoinPurchaseCount: todaysCoinPurchases.length,
    };
  }
}
