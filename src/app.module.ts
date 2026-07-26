import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FollowModule } from './follow/follow.module';
import { WalletModule } from './wallet/wallet.module';
import { LiveModule } from './live/live.module';
import { ChatModule } from './chat/chat.module';
import { GiftsModule } from './gifts/gifts.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { CoinPackagesModule } from './coin-packages/coin-packages.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { StreamingModule } from './streaming/streaming.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { VipModule } from './vip/vip.module';
import { TasksModule } from './tasks/tasks.module';
import { LuckyWheelModule } from './lucky-wheel/lucky-wheel.module';
import { RankingsModule } from './rankings/rankings.module';
import { ReferralsModule } from './referrals/referrals.module';
import { PkBattleModule } from './pk-battle/pk-battle.module';
import { FamilyModule } from './family/family.module';
import { AgencyModule } from './agency/agency.module';
import { ReplayModule } from './replay/replay.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // basic rate limiting, tune per endpoint later
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'liveconnect',
        password: process.env.DB_PASSWORD || 'liveconnect_password',
        database: process.env.DB_NAME || 'liveconnect',
        // Hosted Postgres providers (Supabase, Render, Railway, etc.) require SSL.
        // Set DB_SSL=true in that environment's variables; leave unset for local Docker Postgres.
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        // Deliberately NOT tied to NODE_ENV: there are no migrations yet (see README), so
        // disabling this in production would silently leave you with an empty database and
        // every request failing on "relation does not exist". Set DB_SYNCHRONIZE=false once
        // you've switched to real migrations.
        synchronize: process.env.DB_SYNCHRONIZE !== 'false',
      }),
    }),
    AuthModule,
    UsersModule,
    FollowModule,
    WalletModule,
    LiveModule,
    ChatModule,
    GiftsModule,
    WithdrawalModule,
    CoinPackagesModule,
    AdminModule,
    PaymentsModule,
    StreamingModule,
    NotificationsModule,
    ReportsModule,
    VipModule,
    TasksModule,
    LuckyWheelModule,
    RankingsModule,
    ReferralsModule,
    PkBattleModule,
    FamilyModule,
    AgencyModule,
    ReplayModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
