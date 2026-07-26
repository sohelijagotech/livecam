import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Notification, NotificationType } from './entities/notification.entity';
import { DeviceToken } from './entities/device-token.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private logger = new Logger('NotificationsService');
  private fcmReady = false;

  constructor(
    private config: ConfigService,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(DeviceToken) private tokenRepo: Repository<DeviceToken>,
  ) {}

  onModuleInit() {
    const projectId = this.config.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials not set — push notifications disabled (in-app notifications still work).');
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }
    this.fcmReady = true;
  }

  async registerDeviceToken(userId: string, token: string, platform?: string) {
    const existing = await this.tokenRepo.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform ?? null;
      return this.tokenRepo.save(existing);
    }
    return this.tokenRepo.save(this.tokenRepo.create({ userId, token, platform } as any));
  }

  // Writes the in-app notification record AND fires a push if FCM is configured.
  async notify(userId: string, type: NotificationType, title: string, body?: string, data?: Record<string, any>) {
    const notification = await this.notifRepo.save(
      this.notifRepo.create({ user: { id: userId } as any, type, title, body, data }),
    );

    if (this.fcmReady) {
      const tokens = await this.tokenRepo.find({ where: { userId } });
      if (tokens.length > 0) {
        try {
          await admin.messaging().sendEachForMulticast({
            tokens: tokens.map((t) => t.token),
            notification: { title, body },
            data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
          });
        } catch (err) {
          this.logger.error(`FCM push failed for user ${userId}: ${err.message}`);
        }
      }
    }

    return notification;
  }

  async listForUser(userId: string) {
    return this.notifRepo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async markRead(userId: string, notificationId: string) {
    await this.notifRepo.update({ id: notificationId, user: { id: userId } as any }, { read: true });
    return { message: 'Marked read' };
  }
}
