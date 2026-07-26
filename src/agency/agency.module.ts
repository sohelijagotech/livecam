import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from './entities/agency.entity';
import { AgencyHost } from './entities/agency-host.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';
import { AgencyService } from './agency.service';
import { AgencyController } from './agency.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, AgencyHost, GiftTransaction]), NotificationsModule],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
