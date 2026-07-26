import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipMembership } from './entities/vip-membership.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { VipService } from './vip.service';
import { VipController } from './vip.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VipMembership, Wallet, Transaction])],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
