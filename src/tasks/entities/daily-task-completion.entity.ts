import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DailyTaskType {
  DAILY_LOGIN = 'daily_login',
  WATCH_LIVE_5MIN = 'watch_live_5min',
  SEND_ANY_GIFT = 'send_any_gift',
  SHARE_APP = 'share_app',
}

@Entity('daily_task_completions')
@Unique(['userId', 'taskType', 'completedDate'])
export class DailyTaskCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: DailyTaskType })
  taskType: DailyTaskType;

  // Stored as a date-only string (YYYY-MM-DD) so the unique constraint enforces "once per day".
  @Column({ type: 'date' })
  completedDate: string;

  @CreateDateColumn()
  createdAt: Date;
}
