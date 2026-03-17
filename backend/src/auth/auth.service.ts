import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
      throw new ConflictException('이미 사용 중인 사용자 이름입니다');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = this.userRepository.create({
      email: registerDto.email,
      username: registerDto.username,
      passwordHash,
      displayName: registerDto.displayName || registerDto.username,
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    const { passwordHash: _ph, ...userWithoutPassword } = savedUser;
    void _ph;
    return { user: userWithoutPassword as Omit<User, 'passwordHash'>, tokens };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
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
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
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
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }

  async getMe(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };
    const accessExp =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '15m';
    const refreshExp =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';

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
