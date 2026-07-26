import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LiveSession } from './live-session.entity';

@Entity('live_entries')
@Unique(['liveSessionId', 'viewerId']) // pay once per session, re-entry is free after that
export class LiveEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveSession, { onDelete: 'CASCADE' })
  liveSession: LiveSession;

  @Column()
  liveSessionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  viewer: User;

  @Column()
  viewerId: string;

  @Column({ type: 'int', default: 0 })
  coinsPaid: number;

  @CreateDateColumn()
  createdAt: Date;
}
