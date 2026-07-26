import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface SocialProfile {
  providerId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class SocialAuthService {
  private googleClient: OAuth2Client;

  constructor(private config: ConfigService) {
    this.googleClient = new OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'));
  }

  async verifyGoogleIdToken(idToken: string): Promise<SocialProfile> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) throw new Error('Empty payload');

      return {
        providerId: payload.sub,
        email: payload.email || null,
        displayName: payload.name || null,
        avatarUrl: payload.picture || null,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  async verifyFacebookAccessToken(accessToken: string): Promise<SocialProfile> {
    try {
      // Calling Facebook's Graph API with the client-supplied token both verifies it
      // (an invalid/expired token gets an error response) and fetches the profile in one call.
      const url = `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Facebook token verification failed');
      const data = (await res.json()) as {
        id: string;
        email?: string;
        name?: string;
        picture?: { data?: { url?: string } };
      };
      if (!data.id) throw new Error('Empty Facebook profile');

      return {
        providerId: data.id,
        email: data.email || null,
        displayName: data.name || null,
        avatarUrl: data.picture?.data?.url || null,
      };
    } catch {
      throw new UnauthorizedException('Invalid Facebook access token');
    }
  }
}
