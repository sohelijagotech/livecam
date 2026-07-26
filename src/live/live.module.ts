import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveSession } from './entities/live-session.entity';
import { LiveGuest } from './entities/live-guest.entity';
import { LiveEntry } from './entities/live-entry.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { LiveGuestsService } from './live-guests.service';
import { LiveGuestsController } from './live-guests.controller';
import { StreamingModule } from '../streaming/streaming.module';
import { FollowModule } from '../follow/follow.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveSession, LiveGuest, LiveEntry, Wallet, Transaction]),
    StreamingModule,
    FollowModule,
    NotificationsModule,
    ChatModule,
  ],
  controllers: [LiveController, LiveGuestsController],
  providers: [LiveService, LiveGuestsService],
  exports: [LiveService],
})
export class LiveModule {}
