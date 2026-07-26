import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportTargetType {
  USER = 'user',
  LIVE_SESSION = 'live_session',
  CHAT_MESSAGE = 'chat_message',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  ACTION_TAKEN = 'action_taken',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  reporter: User;

  @Column({ type: 'enum', enum: ReportTargetType })
  targetType: ReportTargetType;

  @Column()
  targetId: string; // userId, liveSessionId, or chat message id depending on targetType

  @Column()
  reason: string; // short category, e.g. 'harassment', 'nudity', 'spam'

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
