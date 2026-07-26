import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('lucky_wheel_spins')
export class LuckyWheelSpin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  coinsWon: number;

  @Column({ default: false })
  wasFreeSpin: boolean;

  @Column({ type: 'date' })
  spinDate: string; // YYYY-MM-DD — used to enforce "1 free spin per day"

  @CreateDateColumn()
  createdAt: Date;
}
