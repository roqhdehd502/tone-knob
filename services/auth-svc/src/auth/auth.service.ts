import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: data.email }, { username: data.username }],
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new RpcException({
          statusCode: 409,
          message: '이미 사용 중인 이메일입니다',
        });
      }
      throw new RpcException({
        statusCode: 409,
        message: '이미 사용 중인 사용자 이름입니다',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      displayName: data.displayName || data.username,
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    const { passwordHash: _ph, ...userWithoutPassword } = savedUser;
    void _ph;
    return { user: userWithoutPassword as Omit<User, 'passwordHash'>, tokens };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      select: [
        'id',
        'email',
        'username',
        'passwordHash',
        'displayName',
        'avatarUrl',
        'subscriptionTier',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 401,
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
    }

    const tokens = await this.generateTokens(user);

    const { passwordHash: _ph2, ...userWithoutPassword } = user;
    void _ph2;
    return { user: userWithoutPassword as Omit<User, 'passwordHash'>, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        refreshToken,
        { secret: this.configService.get<string>('JWT_SECRET') },
      );

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new RpcException({ statusCode: 401, message: '유효하지 않은 토큰입니다' });
      }

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof RpcException) throw err;
      throw new RpcException({ statusCode: 401, message: '유효하지 않은 토큰입니다' });
    }
  }

  async validateUser(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user ?? null;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };
    const accessExp = this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m';
    const refreshExp = this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessExp as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: refreshExp as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
