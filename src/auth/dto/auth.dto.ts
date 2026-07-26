import { IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  referredByCode?: string;
}

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(4)
  code: string;
}

export class GoogleLoginDto {
  @IsString()
  idToken: string; // ID token from Google Sign-In on the client (NOT an access token)
}

export class FacebookLoginDto {
  @IsString()
  accessToken: string; // access token from the Facebook SDK on the client
}
