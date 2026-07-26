import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    private notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException('Cannot follow yourself');
    const existing = await this.followRepo.findOne({ where: { followerId, followingId } });
    if (existing) return existing;
    const follow = this.followRepo.create({ followerId, followingId });
    const saved = await this.followRepo.save(follow);

    await this.notificationsService.notify(
      followingId,
      NotificationType.NEW_FOLLOWER,
      'New Follower',
      'Someone just followed you',
      { followerId },
    );

    return saved;
  }

  async unfollow(followerId: string, followingId: string) {
    await this.followRepo.delete({ followerId, followingId });
    return { message: 'Unfollowed' };
  }

  async getFollowers(userId: string) {
    return this.followRepo.find({ where: { followingId: userId }, relations: ['follower'] });
  }

  async getFollowing(userId: string) {
    return this.followRepo.find({ where: { followerId: userId }, relations: ['following'] });
  }

  async getFollowerIds(userId: string): Promise<string[]> {
    const follows = await this.followRepo.find({ where: { followingId: userId } });
    return follows.map((f) => f.followerId);
  }
}
