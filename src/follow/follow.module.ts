import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Follow]), NotificationsModule],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
