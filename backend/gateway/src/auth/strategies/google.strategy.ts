import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID") ?? "",
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET") ?? "",
      callbackURL:
        configService.get<string>("GOOGLE_CALLBACK_URL") ??
        "http://localhost:3000/api/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string }[];
      displayName?: string;
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ) {
    const user = {
      provider: "google",
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? "",
      displayName: profile.displayName ?? "",
      avatarUrl: profile.photos?.[0]?.value ?? "",
    };
    done(null, user);
  }
}
