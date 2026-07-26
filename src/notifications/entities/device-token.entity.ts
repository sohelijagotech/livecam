import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('device_tokens')
@Unique(['token'])
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  token: string; // FCM registration token

  @Column({ type: 'varchar', nullable: true })
  platform: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
