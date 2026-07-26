import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Family } from './family.entity';

export enum FamilyMemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed',
}

@Entity('family_members')
@Unique(['familyId', 'userId'])
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  family: Family;

  @Column()
  familyId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: FamilyMemberStatus, default: FamilyMemberStatus.INVITED })
  status: FamilyMemberStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date;
}
