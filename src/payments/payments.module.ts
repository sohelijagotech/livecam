import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CoinPackagesModule } from '../coin-packages/coin-packages.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [CoinPackagesModule, WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
