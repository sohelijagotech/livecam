import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PkBattle } from './entities/pk-battle.entity';
import { LiveSession } from '../live/entities/live-session.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { PkBattleService } from './pk-battle.service';
import { PkBattleController } from './pk-battle.controller';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([PkBattle, LiveSession, GiftTransaction]), ChatModule, NotificationsModule],
  controllers: [PkBattleController],
  providers: [PkBattleService],
})
export class PkBattleModule {}
