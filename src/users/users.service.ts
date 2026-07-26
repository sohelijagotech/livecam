import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, data: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'bio'>>) {
    await this.usersRepo.update(id, data);
    return this.findById(id);
  }

  // --- Admin Panel: User Management ---

  async search(query: string) {
    return this.usersRepo
      .createQueryBuilder('user')
      .where('user.phone ILIKE :q OR user.displayName ILIKE :q OR user.email ILIKE :q', {
        q: `%${query}%`,
      })
      .take(50)
      .getMany();
  }

  async setStatus(id: string, status: User['status']) {
    await this.findById(id); // throws if not found
    await this.usersRepo.update(id, { status });
    return this.findById(id);
  }

  async verifyIdentity(id: string) {
    await this.findById(id);
    await this.usersRepo.update(id, { phoneVerified: true });
    return this.findById(id);
  }
}
