import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyTaskCompletion, DailyTaskType } from './entities/daily-task-completion.entity';
import { User } from '../users/entities/user.entity';
import { DAILY_TASK_XP, DAILY_TASK_LABELS } from './daily-task.config';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (server timezone)
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(DailyTaskCompletion) private completionRepo: Repository<DailyTaskCompletion>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async listToday(userId: string) {
    const today = todayDateString();
    const completions = await this.completionRepo.find({ where: { userId, completedDate: today } });
    const completedTypes = new Set(completions.map((c) => c.taskType));

    return Object.values(DailyTaskType).map((type) => ({
      type,
      label: DAILY_TASK_LABELS[type],
      xpReward: DAILY_TASK_XP[type],
      completed: completedTypes.has(type),
    }));
  }

  // Idempotent: relies on the DB unique constraint (userId, taskType, completedDate) so
  // duplicate claims (e.g. a retried request) simply no-op instead of double-rewarding XP.
  async claim(userId: string, taskType: DailyTaskType) {
    const today = todayDateString();
    const existing = await this.completionRepo.findOne({ where: { userId, taskType, completedDate: today } });
    if (existing) throw new BadRequestException('Task already claimed today');

    await this.completionRepo.save(this.completionRepo.create({ userId, taskType, completedDate: today } as any));

    const xp = DAILY_TASK_XP[taskType];
    await this.usersRepo.increment({ id: userId }, 'levelXp', xp);

    return { taskType, xpAwarded: xp };
  }
}
