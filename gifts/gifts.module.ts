import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gift } from './entities/gift.entity';
import { GiftTransaction } from './entities/gift-transaction.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { LiveSession } from '../live/entities/live-session.entity';
import { GiftsService } from './gifts.service';
import { GiftsController } from './gifts.controller';
import { ChatModule } from '../chat/chat.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gift, GiftTransaction, Wallet, Transaction, LiveSession]),
    ChatModule,
    TasksModule,
  ],
  controllers: [GiftsController],
  providers: [GiftsService],
  exports: [GiftsService],
})
export class GiftsModule {}
