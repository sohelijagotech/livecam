import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { RegisterDto, LoginDto, VerifyOtpDto, GoogleLoginDto, FacebookLoginDto } from './dto/auth.dto';
import { TasksService } from '../tasks/tasks.service';
import { DailyTaskType } from '../tasks/entities/daily-task-completion.entity';
import { ReferralsService } from '../referrals/referrals.service';
import { SocialAuthService, SocialProfile } from './social-auth.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    private jwt: JwtService,
    private config: ConfigService,
    private tasksService: TasksService,
    private referralsService: ReferralsService,
    private socialAuthService: SocialAuthService,
  ) {}

  private issueTokens(user: User) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });
    return { accessToken, refreshToken };
  }

  // Best-effort — a user who already claimed today's login XP just gets a BadRequestException
  // internally, which we swallow here since login must never fail because of the task system.
  private async claimDailyLoginXp(userId: string) {
    try {
      await this.tasksService.claim(userId, DailyTaskType.DAILY_LOGIN);
    } catch {
      /* already claimed today — ignore */
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let referredByUserId: string | null = null;
    if (dto.referredByCode) {
      const referrer = await this.referralsService.findReferrerByCode(dto.referredByCode);
      if (referrer) referredByUserId = referrer.id;
    }

    // Retry a few times on the unlikely event of a referral-code collision.
    let referralCode = this.referralsService.generateCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const clash = await this.usersRepo.findOne({ where: { referralCode } });
      if (!clash) break;
      referralCode = this.referralsService.generateCode();
    }

    const user = this.usersRepo.create({
      phone: dto.phone,
      passwordHash,
      displayName: dto.displayName || `user_${Date.now()}`,
      referralCode,
      referredByUserId,
    });
    await this.usersRepo.save(user);

    // Create wallet for the new user
    const wallet = this.walletRepo.create({ user, coinBalance: 0, diamondBalance: 0 });
    await this.walletRepo.save(wallet);

    await this.sendOtp(dto.phone);

    return { message: 'Registered. OTP sent for phone verification.', userId: user.id };
  }

  // Phase 1: OTP generation is stubbed for local dev — plug in an SMS provider (e.g. Twilio) here.
  async sendOtp(phone: string) {
    const user = await this.usersRepo.findOne({ where: { phone } });
    if (!user) throw new BadRequestException('User not found');

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const expiresSeconds = parseInt(this.config.get('OTP_EXPIRES_IN_SECONDS') || '300', 10);

    user.otpCodeHash = await bcrypt.hash(code, 10);
    user.otpExpiresAt = new Date(Date.now() + expiresSeconds * 1000);
    await this.usersRepo.save(user);

    // TODO: send `code` via SMS provider instead of logging
    console.log(`[DEV ONLY] OTP for ${phone}: ${code}`);

    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersRepo.findOne({
      where: { phone: dto.phone },
      select: ['id', 'phone', 'role', 'otpCodeHash', 'otpExpiresAt', 'phoneVerified', 'referredByUserId'],
    });
    if (!user || !user.otpCodeHash) throw new BadRequestException('No OTP requested');
    if (user.otpExpiresAt < new Date()) throw new BadRequestException('OTP expired');

    const valid = await bcrypt.compare(dto.code, user.otpCodeHash);
    if (!valid) throw new BadRequestException('Invalid OTP');

    user.phoneVerified = true;
    user.otpCodeHash = null;
    user.otpExpiresAt = null;
    await this.usersRepo.save(user);

    await this.claimDailyLoginXp(user.id);
    await this.referralsService.rewardReferrerIfEligible(user);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { phone: dto.phone },
      select: ['id', 'phone', 'role', 'passwordHash', 'status'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses Google/Facebook sign-in — use that instead');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status !== 'active') {
      throw new UnauthorizedException(`Account is ${user.status}`);
    }

    await this.claimDailyLoginXp(user.id);

    return this.issueTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, { secret: this.config.get('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') throw new UnauthorizedException('Invalid refresh token');

    return this.issueTokens(user);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const profile = await this.socialAuthService.verifyGoogleIdToken(dto.idToken);
    const user = await this.findOrCreateSocialUser(AuthProvider.GOOGLE, profile);
    await this.claimDailyLoginXp(user.id);
    return this.issueTokens(user);
  }

  async loginWithFacebook(dto: FacebookLoginDto) {
    const profile = await this.socialAuthService.verifyFacebookAccessToken(dto.accessToken);
    const user = await this.findOrCreateSocialUser(AuthProvider.FACEBOOK, profile);
    await this.claimDailyLoginXp(user.id);
    return this.issueTokens(user);
  }

  private async findOrCreateSocialUser(provider: AuthProvider, profile: SocialProfile): Promise<User> {
    const idField = provider === AuthProvider.GOOGLE ? 'googleId' : 'facebookId';

    let user = await this.usersRepo.findOne({ where: { [idField]: profile.providerId } as any });
    if (user) return user;

    // Link to an existing password/other-provider account that shares this email, if any —
    // avoids creating a duplicate account when someone used email+password before switching
    // to "Continue with Google/Facebook".
    if (profile.email) {
      const existingByEmail = await this.usersRepo.findOne({ where: { email: profile.email } });
      if (existingByEmail) {
        (existingByEmail as any)[idField] = profile.providerId;
        return this.usersRepo.save(existingByEmail);
      }
    }

    let referralCode = this.referralsService.generateCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const clash = await this.usersRepo.findOne({ where: { referralCode } });
      if (!clash) break;
      referralCode = this.referralsService.generateCode();
    }

    const newUser = this.usersRepo.create({
      email: profile.email,
      displayName: profile.displayName || `user_${Date.now()}`,
      avatarUrl: profile.avatarUrl,
      authProvider: provider,
      [idField]: profile.providerId,
      referralCode,
      // Social sign-in verifies the person's identity via the provider — phone verification
      // is not required to use the app, only for flows that specifically need it (e.g. add a
      // phone later before withdrawing, if that policy is added).
      phoneVerified: false,
    } as Partial<User>);
    await this.usersRepo.save(newUser);

    const wallet = this.walletRepo.create({ user: newUser, coinBalance: 0, diamondBalance: 0 });
    await this.walletRepo.save(wallet);

    return newUser;
  }
}
