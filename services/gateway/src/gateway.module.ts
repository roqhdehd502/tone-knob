import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AiProxyModule } from "./ai/ai-proxy.module";
import { AuthProxyModule } from "./auth/auth-proxy.module";
import { ClientsRegisterModule } from "./clients/clients-register.module";
import { CommunityProxyModule } from "./community/community-proxy.module";
import { JamProxyModule } from "./jam/jam-proxy.module";
import { MarketplaceProxyModule } from "./marketplace/marketplace-proxy.module";
import { MediaProxyModule } from "./media/media-proxy.module";
import { SubscriptionProxyModule } from "./subscription/subscription-proxy.module";
import { TabProxyModule } from "./tab/tab-proxy.module";
import { UserProxyModule } from "./user/user-proxy.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ClientsRegisterModule,
    AuthProxyModule,
    UserProxyModule,
    TabProxyModule,
    JamProxyModule,
    CommunityProxyModule,
    MarketplaceProxyModule,
    SubscriptionProxyModule,
    MediaProxyModule,
    AiProxyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class GatewayModule {}
