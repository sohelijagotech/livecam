import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { LiveSession } from './live-session.entity';

@Entity('live_replays')
export class LiveReplay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => LiveSession, { onDelete: 'CASCADE' })
  @JoinColumn()
  liveSession: LiveSession;

  @Column()
  liveSessionId: string;

  @Column()
  videoUrl: string;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
