import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';

import { Repository } from 'typeorm';

import {
  KnobTransaction,
  KnobTransactionType,
} from '../entities/knob-transaction.entity';
import { User } from '../entities/user.entity';

const COMMISSION_RATE = 0.3;

@Injectable()
export class KnobService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(KnobTransaction)
    private readonly txRepository: Repository<KnobTransaction>,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.knobBalance ?? 0;
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: KnobTransaction[]; total: number }> {
    const [data, total] = await this.txRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async spend(
    userId: string,
    amount: number,
    type: KnobTransactionType,
    description?: string,
    referenceId?: string,
  ): Promise<KnobTransaction> {
    if (amount <= 0) {
      throw new RpcException(
        new BadRequestException('차감 금액은 0보다 커야 합니다'),
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException(
        new BadRequestException('사용자를 찾을 수 없습니다'),
      );
    }

    if (user.knobBalance < amount) {
      throw new RpcException(
        new BadRequestException(
          `Knob 잔액이 부족합니다 (현재: ${user.knobBalance}, 필요: ${amount})`,
        ),
      );
    }

    user.knobBalance -= amount;
    await this.userRepository.save(user);

    const tx = this.txRepository.create({
      userId,
      type,
      amount: -amount,
      balanceAfter: user.knobBalance,
      description,
      referenceId,
    });
    return this.txRepository.save(tx);
  }

  async earnFromSale(
    sellerId: string,
    saleAmount: number,
    referenceId?: string,
  ): Promise<KnobTransaction> {
    const netAmount = Math.floor(saleAmount * (1 - COMMISSION_RATE));
    if (netAmount <= 0) return {} as KnobTransaction;

    const user = await this.userRepository.findOne({
      where: { id: sellerId },
    });
    if (!user) {
      throw new RpcException(
        new BadRequestException('판매자를 찾을 수 없습니다'),
      );
    }

    user.knobBalance += netAmount;
    await this.userRepository.save(user);

    const tx = this.txRepository.create({
      userId: sellerId,
      type: KnobTransactionType.EARN_TAB_SALE,
      amount: netAmount,
      balanceAfter: user.knobBalance,
      description: `타브 판매 수익 (수수료 ${Math.round(COMMISSION_RATE * 100)}% 차감)`,
      referenceId,
    });
    return this.txRepository.save(tx);
  }
}
