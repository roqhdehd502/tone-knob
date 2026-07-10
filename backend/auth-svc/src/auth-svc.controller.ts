import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";
import { AUTH_EVENTS } from "@tone-knob/shared";

import { AuthService } from "./auth/auth.service";
import { UserService } from "./user/user.service";

@Controller()
export class AuthSvcController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @Inject("MARKETPLACE_SERVICE")
    private readonly marketplaceClient: ClientProxy,
  ) {}

  @MessagePattern("auth.register")
  async register(
    @Payload()
    data: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
    },
  ) {
    return this.authService.register(data);
  }

  @MessagePattern("auth.login")
  async login(@Payload() data: { email: string; password: string }) {
    const result = await this.authService.login(data);
    this.marketplaceClient.emit(AUTH_EVENTS.USER_LOGGED_IN, {
      userId: result.user.id,
    });
    return result;
  }

  @MessagePattern("auth.refresh")
  async refresh(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @MessagePattern("auth.socialLogin")
  async socialLogin(
    @Payload()
    data: {
      provider: string;
      providerId: string;
      email: string;
      displayName?: string;
      avatarUrl?: string;
    },
  ) {
    const result = await this.authService.socialLogin(data);
    this.marketplaceClient.emit(AUTH_EVENTS.USER_LOGGED_IN, {
      userId: result.user.id,
    });
    return result;
  }

  @MessagePattern("auth.validate")
  async validate(@Payload() data: { userId: string }) {
    return this.authService.validateUser(data.userId);
  }

  @MessagePattern("users.findById")
  async findUser(@Payload() data: { id: string }) {
    return this.userService.findById(data.id);
  }

  @MessagePattern("users.update")
  async updateUser(
    @Payload()
    data: {
      id: string;
      dto: { displayName?: string; avatarUrl?: string; bio?: string };
    },
  ) {
    return this.userService.update(data.id, data.dto);
  }
}
