import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { User } from './user.types';

@Injectable()
export class UserService {
  private readonly usersById = new Map<string, User>();
  private readonly userIdByEmail = new Map<string, string>();

  create(email: string, passwordHash: string): User {
    const id = randomUUID();
    const user: User = { id, email, passwordHash };
    this.usersById.set(id, user);
    this.userIdByEmail.set(email, id);
    return user;
  }

  findByEmail(email: string): User | undefined {
    const id = this.userIdByEmail.get(email);
    if (!id) return undefined;
    return this.usersById.get(id);
  }

  findById(id: string): User | undefined {
    return this.usersById.get(id);
  }

  updateProfile(
    userId: string,
    update: { nickname?: string; instrument?: string },
  ): User {
    const user = this.usersById.get(userId);
    if (!user) {
      // In MVP memory store, this should not happen if JWT is valid.
      throw new Error('User not found');
    }

    const next: User = {
      ...user,
      nickname: update.nickname ?? user.nickname,
      instrument: update.instrument ?? user.instrument,
    };

    this.usersById.set(userId, next);
    return next;
  }
}
