import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('referrals')
@Unique(['referredUserId']) // each referred user can only trigger one reward, ever
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  referrer: User;

  @Column()
  referrerId: string;

  @Column()
  referredUserId: string;

  @Column({ type: 'int' })
  rewardCoins: number;

  @CreateDateColumn()
  createdAt: Date;
}
