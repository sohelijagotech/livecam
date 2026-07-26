import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LuckyWheelSpin } from './entities/lucky-wheel-spin.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { LuckyWheelService } from './lucky-wheel.service';
import { LuckyWheelController } from './lucky-wheel.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LuckyWheelSpin, Wallet, Transaction])],
  controllers: [LuckyWheelController],
  providers: [LuckyWheelService],
})
export class LuckyWheelModule {}
