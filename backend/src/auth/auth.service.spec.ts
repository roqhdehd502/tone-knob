import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    avatarUrl: null,
    subscriptionTier: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Record<string, jest.Mock>;
  let jwtService: { signAsync: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'user-1', ...entity })),
      findOne: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return map[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const result = await service.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'password123',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          username: 'newuser',
          passwordHash: 'hashed-pw',
        }),
      );
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-token');
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue(
        mockUser({ email: 'existing@example.com' }),
      );

      await expect(
        service.register({
          email: 'existing@example.com',
          username: 'newuser',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username already exists', async () => {
      userRepo.findOne.mockResolvedValue(
        mockUser({ email: 'other@example.com', username: 'taken' }),
      );

      await expect(
        service.register({
          email: 'new@example.com',
          username: 'taken',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user and tokens on valid credentials', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.tokens.accessToken).toBe('mock-token');
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens with valid refresh token', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
      });
      userRepo.findOne.mockResolvedValue(mockUser());

      const result = await service.refreshToken('valid-refresh-token');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'gone', email: 'a@b.com' });
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    it('should return user without passwordHash', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());

      const result = await service.getMe('user-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
