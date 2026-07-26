import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinPackage } from './entities/coin-package.entity';
import { CoinPackagesService } from './coin-packages.service';
import { CoinPackagesController } from './coin-packages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoinPackage])],
  controllers: [CoinPackagesController],
  providers: [CoinPackagesService],
  exports: [CoinPackagesService],
})
export class CoinPackagesModule {}
