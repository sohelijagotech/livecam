import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vip_memberships')
export class VipMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int', default: 0 })
  level: number; // 0 = not VIP, 1-10 per blueprint

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
