import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Settlement, SettlementStatus } from '../entities/settlement.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Settlement)
    private readonly settlementRepository: Repository<Settlement>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  private assertAdmin(user: { role?: string }): void {
    if (user.role !== 'admin') {
      throw new ForbiddenException('관리자 권한이 필요합니다');
    }
  }

  // === 사용자 관리 ===

  async listUsers(
    adminUser: { role?: string },
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: User[]; total: number }> {
    this.assertAdmin(adminUser);

    const qb = this.userRepository.createQueryBuilder('user');

    if (search) {
      qb.where('user.email ILIKE :search OR user.displayName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getUserDetail(
    adminUser: { role?: string },
    userId: string,
  ): Promise<User> {
    this.assertAdmin(adminUser);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async updateUserRole(
    adminUser: { role?: string },
    userId: string,
    role: string,
  ): Promise<User> {
    this.assertAdmin(adminUser);
    const user = await this.getUserDetail(adminUser, userId);
    user.role = role;
    return this.userRepository.save(user);
  }

  async deleteUser(
    adminUser: { role?: string },
    userId: string,
  ): Promise<void> {
    this.assertAdmin(adminUser);
    const user = await this.getUserDetail(adminUser, userId);
    await this.userRepository.remove(user);
  }

  // === 정산 관리 ===

  async listSettlements(
    adminUser: { role?: string },
    page = 1,
    limit = 20,
    status?: SettlementStatus,
  ): Promise<{ data: Settlement[]; total: number }> {
    this.assertAdmin(adminUser);

    const where = status ? { status } : {};
    const [data, total] = await this.settlementRepository.findAndCount({
      where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async updateSettlementStatus(
    adminUser: { role?: string },
    settlementId: string,
    status: SettlementStatus,
    externalTransferId?: string,
  ): Promise<Settlement> {
    this.assertAdmin(adminUser);
    const settlement = await this.settlementRepository.findOne({
      where: { id: settlementId },
    });
    if (!settlement) {
      throw new NotFoundException('정산 내역을 찾을 수 없습니다');
    }
    settlement.status = status;
    if (externalTransferId) {
      settlement.externalTransferId = externalTransferId;
    }
    return this.settlementRepository.save(settlement);
  }

  // === 구독 관리 ===

  async listSubscriptions(
    adminUser: { role?: string },
    page = 1,
    limit = 20,
    status?: SubscriptionStatus,
  ): Promise<{ data: Subscription[]; total: number }> {
    this.assertAdmin(adminUser);

    const where = status ? { status } : {};
    const [data, total] = await this.subscriptionRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // === 대시보드 통계 ===

  async getDashboardStats(adminUser: { role?: string }): Promise<{
    totalUsers: number;
    totalSettlements: number;
    pendingSettlements: number;
    activeSubscriptions: number;
  }> {
    this.assertAdmin(adminUser);

    const [
      totalUsers,
      totalSettlements,
      pendingSettlements,
      activeSubscriptions,
    ] = await Promise.all([
      this.userRepository.count(),
      this.settlementRepository.count(),
      this.settlementRepository.count({
        where: { status: SettlementStatus.PENDING },
      }),
      this.subscriptionRepository.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
    ]);

    return {
      totalUsers,
      totalSettlements,
      pendingSettlements,
      activeSubscriptions,
    };
  }
}
