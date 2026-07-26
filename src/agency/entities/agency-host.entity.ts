import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Agency } from './agency.entity';

export enum AgencyHostStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed',
}

@Entity('agency_hosts')
@Unique(['agencyId', 'hostId'])
export class AgencyHost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Agency, { onDelete: 'CASCADE' })
  agency: Agency;

  @Column()
  agencyId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  host: User;

  @Column()
  hostId: string;

  @Column({ type: 'enum', enum: AgencyHostStatus, default: AgencyHostStatus.INVITED })
  status: AgencyHostStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date;
}
