import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ClientProxy, RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { KNOB_EVENTS } from "@tone-knob/shared";
import { MoreThanOrEqual, Repository } from "typeorm";

import { KnobTransaction, KnobTransactionType } from "../entities/knob-transaction.entity";
import { User } from "../entities/user.entity";

const COMMISSION_RATE = 0.3;

// 활동 기반 자동 적립 보상액 (Knob 단위)
const TAB_CREATED_REWARD = 10;
const JAM_PARTICIPATED_REWARD = 5;
const DAILY_LOGIN_REWARD = 3;

@Injectable()
export class KnobService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(KnobTransaction)
    private readonly txRepository: Repository<KnobTransaction>,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
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
      order: { createdAt: "DESC" },
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
      throw new RpcException(new BadRequestException("차감 금액은 0보다 커야 합니다"));
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException(new BadRequestException("사용자를 찾을 수 없습니다"));
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
    const saved = await this.txRepository.save(tx);

    this.communityClient.emit(KNOB_EVENTS.SPENT, {
      userId,
      amount,
      type,
      balanceAfter: saved.balanceAfter,
      referenceId,
    });

    return saved;
  }

  async earnFromSale(
    sellerId: string,
    saleAmount: number,
    referenceId?: string,
  ): Promise<KnobTransaction> {
    const netAmount = Math.floor(saleAmount * (1 - COMMISSION_RATE));
    if (netAmount <= 0) return {} as KnobTransaction;

    return this.recordEarn(
      sellerId,
      netAmount,
      KnobTransactionType.EARN_TAB_SALE,
      `타브 판매 수익 (수수료 ${Math.round(COMMISSION_RATE * 100)}% 차감)`,
      referenceId,
    );
  }

  async earnFromTabCreated(userId: string, tabId: string): Promise<KnobTransaction> {
    return this.recordEarn(
      userId,
      TAB_CREATED_REWARD,
      KnobTransactionType.EARN_TAB_CREATED,
      "타브 제작 보상",
      tabId,
    );
  }

  async earnFromJamParticipation(userId: string, roomId: string): Promise<KnobTransaction> {
    return this.recordEarn(
      userId,
      JAM_PARTICIPATED_REWARD,
      KnobTransactionType.EARN_JAM_PARTICIPATED,
      "합주 참여 보상",
      roomId,
    );
  }

  /** 하루 1회로 제한되는 일일 로그인 보상. 이미 지급된 경우 null을 반환한다. */
  async earnDailyLogin(userId: string): Promise<KnobTransaction | null> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const alreadyEarnedToday = await this.txRepository.findOne({
      where: {
        userId,
        type: KnobTransactionType.EARN_DAILY_LOGIN,
        createdAt: MoreThanOrEqual(todayStart),
      },
    });
    if (alreadyEarnedToday) return null;

    return this.recordEarn(
      userId,
      DAILY_LOGIN_REWARD,
      KnobTransactionType.EARN_DAILY_LOGIN,
      "일일 로그인 보상",
    );
  }

  private async recordEarn(
    userId: string,
    amount: number,
    type: KnobTransactionType,
    description?: string,
    referenceId?: string,
  ): Promise<KnobTransaction> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException(new BadRequestException("사용자를 찾을 수 없습니다"));
    }

    user.knobBalance += amount;
    await this.userRepository.save(user);

    const tx = this.txRepository.create({
      userId,
      type,
      amount,
      balanceAfter: user.knobBalance,
      description,
      referenceId,
    });
    const saved = await this.txRepository.save(tx);

    this.communityClient.emit(KNOB_EVENTS.EARNED, {
      userId,
      amount,
      type,
      balanceAfter: saved.balanceAfter,
      referenceId,
    });

    return saved;
  }
}
