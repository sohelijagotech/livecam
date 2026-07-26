import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { LiveSession } from '../live/entities/live-session.entity';
import { Withdrawal } from '../withdrawal/entities/withdrawal.entity';
import { Transaction } from '../wallet/entities/transaction.entity';

import { UsersModule } from '../users/users.module';
import { LiveModule } from '../live/live.module';
import { GiftsModule } from '../gifts/gifts.module';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';
import { CoinPackagesModule } from '../coin-packages/coin-packages.module';

import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminLiveController } from './admin-live.controller';
import { AdminGiftsController } from './admin-gifts.controller';
import { AdminCoinPackagesController } from './admin-coin-packages.controller';
import { AdminFinanceController } from './admin-finance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LiveSession, Withdrawal, Transaction]),
    UsersModule,
    LiveModule,
    GiftsModule,
    WithdrawalModule,
    CoinPackagesModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminLiveController,
    AdminGiftsController,
    AdminCoinPackagesController,
    AdminFinanceController,
  ],
})
export class AdminModule {}
