import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  HOST = 'host',
  AGENCY = 'agency',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum AuthProvider {
  PASSWORD = 'password',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ select: false, nullable: true })
  passwordHash: string;

  @Column({ unique: true, nullable: true })
  googleId: string;

  @Column({ unique: true, nullable: true })
  facebookId: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.PASSWORD })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  otpCodeHash: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  otpExpiresAt: Date | null;

  @Column({ default: 0 })
  levelXp: number;

  @Column({ unique: true, nullable: true })
  referralCode: string;

  @Column({ type: 'varchar', nullable: true })
  referredByUserId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
