import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LiveSession } from './live-session.entity';

export enum LiveGuestStatus {
  INVITED = 'invited',
  JOINED = 'joined',
  LEFT = 'left',
  REJECTED = 'rejected',
  REMOVED = 'removed', // kicked by the host
}

const MAX_GUESTS_PER_SESSION = 8; // Agora broadcaster limits + UI grid practicality

@Entity('live_guests')
export class LiveGuest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveSession, { onDelete: 'CASCADE' })
  liveSession: LiveSession;

  @Column()
  liveSessionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  guest: User;

  @Column()
  guestId: string;

  @Column({ type: 'enum', enum: LiveGuestStatus, default: LiveGuestStatus.INVITED })
  status: LiveGuestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date;
}

export { MAX_GUESTS_PER_SESSION };
