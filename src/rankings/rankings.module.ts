import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GiftTransaction])],
  controllers: [RankingsController],
  providers: [RankingsService],
})
export class RankingsModule {}
