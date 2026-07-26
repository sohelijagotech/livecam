import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveSession } from '../live/entities/live-session.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { Follow } from '../follow/entities/follow.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LiveSession, GiftTransaction, Follow])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
