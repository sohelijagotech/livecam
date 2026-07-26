import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinPackage } from './entities/coin-package.entity';

@Injectable()
export class CoinPackagesService {
  constructor(@InjectRepository(CoinPackage) private repo: Repository<CoinPackage>) {}

  listActive() {
    return this.repo.find({ where: { active: true }, order: { priceUsd: 'ASC' } });
  }

  listAll() {
    return this.repo.find({ order: { priceUsd: 'ASC' } });
  }

  create(data: Partial<CoinPackage>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<CoinPackage>) {
    const pkg = await this.repo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Coin package not found');
    Object.assign(pkg, data);
    return this.repo.save(pkg);
  }

  async remove(id: string) {
    const pkg = await this.repo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Coin package not found');
    await this.repo.remove(pkg);
    return { message: 'Removed' };
  }
}
