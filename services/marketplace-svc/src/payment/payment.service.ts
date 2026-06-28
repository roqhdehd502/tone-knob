import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Payment, PaymentStatus, PaymentType } from "../entities/payment.entity";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async createPayment(
    userId: string,
    data: { type: PaymentType; amount: number; metadata?: Record<string, unknown> },
  ): Promise<Payment> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const payment = this.paymentRepository.create({
      userId,
      type: data.type,
      amount: data.amount,
      status: PaymentStatus.PENDING,
      externalOrderId: orderId,
      metadata: data.metadata,
    });
    return this.paymentRepository.save(payment);
  }

  async confirmPayment(
    paymentId: string,
    userId: string,
    externalPaymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new RpcException(new NotFoundException("결제 내역을 찾을 수 없습니다"));
    if (payment.userId !== userId) {
      throw new RpcException(new ForbiddenException("본인의 결제만 처리할 수 있습니다"));
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new RpcException(new BadRequestException("이미 처리된 결제입니다"));
    }

    // TODO: 실 서비스 적용 전 PG사(토스페이먼츠 등) 결제 조회 API로 externalPaymentId의 금액/상태를
    // 서버 측에서 재검증해야 한다. 현재는 클라이언트가 보낸 값을 그대로 신뢰한다(결제 위조 가능 — 보안 검토 항목).
    payment.status = PaymentStatus.COMPLETED;
    payment.externalPaymentId = externalPaymentId;
    return this.paymentRepository.save(payment);
  }

  async refundPayment(paymentId: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new RpcException(new NotFoundException("결제 내역을 찾을 수 없습니다"));
    if (payment.userId !== userId) {
      throw new RpcException(new ForbiddenException("본인의 결제만 환불할 수 있습니다"));
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new RpcException(new BadRequestException("완료된 결제만 환불할 수 있습니다"));
    }

    payment.status = PaymentStatus.REFUNDED;
    return this.paymentRepository.save(payment);
  }

  async getPaymentById(paymentId: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new RpcException(new NotFoundException("결제 내역을 찾을 수 없습니다"));
    if (payment.userId !== userId) {
      throw new RpcException(new ForbiddenException("본인의 결제만 조회할 수 있습니다"));
    }
    return payment;
  }

  async getMyPayments(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Payment[]; total: number }> {
    const [data, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
