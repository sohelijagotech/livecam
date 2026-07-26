import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LiveStatus {
  LIVE = 'live',
  ENDED = 'ended',
  STOPPED_BY_ADMIN = 'stopped_by_admin',
}

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  host: User;

  @Column()
  hostId: string;

  @Column({ nullable: true })
  title: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ type: 'int', default: 0 })
  entryFeeCoins: number; // 0 = free to join; >0 = viewers must pay before joining (Paid/Private Live)

  @Column({ nullable: true })
  streamChannelName: string; // channel name for Agora/ZEGOCLOUD/100ms

  @Column({ type: 'enum', enum: LiveStatus, default: LiveStatus.LIVE })
  status: LiveStatus;

  @Column({ default: 0 })
  peakViewers: number;

  @Column({ type: 'bigint', default: 0 })
  totalDiamondsEarned: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;
}
