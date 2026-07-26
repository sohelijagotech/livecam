import { Controller, Get } from '@nestjs/common';
import { CoinPackagesService } from './coin-packages.service';

@Controller('coin-packages')
export class CoinPackagesController {
  constructor(private service: CoinPackagesService) {}

  @Get()
  list() {
    return this.service.listActive();
  }
}
