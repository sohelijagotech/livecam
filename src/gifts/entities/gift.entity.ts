import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gifts')
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  animationUrl: string;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ type: 'int' })
  coinPrice: number;

  @Column({ default: true })
  active: boolean;
}
