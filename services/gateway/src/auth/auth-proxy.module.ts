import { Module, Provider, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthProxyController } from "./auth-proxy.controller";
import { GitHubStrategy } from "./strategies/github.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

const logger = new Logger("AuthProxyModule");

function buildOAuthProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GOOGLE_CLIENT_ID) {
    providers.push(GoogleStrategy);
    logger.log("Google OAuth strategy registered");
  } else {
    logger.warn("GOOGLE_CLIENT_ID not set — Google OAuth disabled");
  }

  if (process.env.GITHUB_CLIENT_ID) {
    providers.push(GitHubStrategy);
    logger.log("GitHub OAuth strategy registered");
  } else {
    logger.warn("GITHUB_CLIENT_ID not set — GitHub OAuth disabled");
  }

  return providers;
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [AuthProxyController],
  providers: [JwtStrategy, ...buildOAuthProviders()],
})
export class AuthProxyModule {}
