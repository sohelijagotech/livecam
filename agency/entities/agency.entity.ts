import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: string;

  // Percentage of each managed host's diamond earnings the agency takes, e.g. 10.00 = 10%.
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionRate: number;

  @CreateDateColumn()
  createdAt: Date;
}
