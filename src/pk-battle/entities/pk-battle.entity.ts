import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LiveSession } from '../../live/entities/live-session.entity';

export enum PkBattleStatus {
  PENDING = 'pending', // invite sent, awaiting opponent's response
  LIVE = 'live',
  ENDED = 'ended',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

@Entity('pk_battles')
export class PkBattle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  hostA: User;

  @Column()
  hostAId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  hostB: User;

  @Column()
  hostBId: string;

  @ManyToOne(() => LiveSession, { onDelete: 'CASCADE' })
  liveSessionA: LiveSession;

  @Column()
  liveSessionAId: string;

  @ManyToOne(() => LiveSession, { onDelete: 'CASCADE' })
  liveSessionB: LiveSession;

  @Column()
  liveSessionBId: string;

  @Column({ type: 'enum', enum: PkBattleStatus, default: PkBattleStatus.PENDING })
  status: PkBattleStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  winnerHostId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
