import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Family, FamilyMember, GiftTransaction]), NotificationsModule],
  controllers: [FamilyController],
  providers: [FamilyService],
})
export class FamilyModule {}
