import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

@Injectable()
export class StreamingService {
  constructor(private config: ConfigService) {}

  // uid = 0 lets Agora auto-assign a numeric uid to the joining client.
  generateRtcToken(channelName: string, role: 'host' | 'audience', uid: number = 0) {
    const appId = this.config.get<string>('STREAMING_APP_ID');
    const appCertificate = this.config.get<string>('STREAMING_APP_CERTIFICATE');
    const expirationTimeInSeconds = 3600; // 1 hour — refresh via this endpoint again if the live runs longer
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const rtcRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs,
    );

    return { token, appId, channelName, uid, expiresAt: privilegeExpiredTs };
  }
}
