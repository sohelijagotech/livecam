import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveReplay } from '../live/entities/live-replay.entity';
import { LiveSession } from '../live/entities/live-session.entity';
import { ReplayService } from './replay.service';
import { ReplayController } from './replay.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LiveReplay, LiveSession])],
  controllers: [ReplayController],
  providers: [ReplayService],
})
export class ReplayModule {}
