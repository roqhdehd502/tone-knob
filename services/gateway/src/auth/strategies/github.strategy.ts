import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-github2";

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>("GITHUB_CLIENT_ID") ?? "",
      clientSecret: configService.get<string>("GITHUB_CLIENT_SECRET") ?? "",
      callbackURL:
        configService.get<string>("GITHUB_CALLBACK_URL") ??
        "http://localhost:3000/api/auth/github/callback",
      scope: ["user:email"],
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
    done: (err: unknown, user?: Record<string, unknown>) => void,
  ) {
    const user = {
      provider: "github",
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? "",
      displayName: profile.displayName ?? "",
      avatarUrl: profile.photos?.[0]?.value ?? "",
    };
    done(null, user);
  }
}
