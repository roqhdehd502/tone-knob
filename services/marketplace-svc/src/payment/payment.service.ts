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
import { PortoneService } from "./portone.service";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly portoneService: PortoneService,
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

  /**
   * 결제 확정 전 공통 검증: 소유권·상태 확인 후 PortOne V2 API로 금액·상태를 재검증한다.
   * externalPaymentId가 이미 다른 결제 건에 사용된 경우(재전송·재생 공격) 거부한다.
   */
  private async verifyAndLoadPendingPayment(
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

    const duplicate = await this.paymentRepository.findOne({ where: { externalPaymentId } });
    if (duplicate) {
      throw new RpcException(new BadRequestException("이미 다른 결제에 사용된 PG 승인 키입니다"));
    }

    try {
      await this.portoneService.verifyPayment(externalPaymentId, payment.amount);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "PG사 결제 검증 실패";
      throw new RpcException(new BadRequestException(`결제 검증 실패: ${msg}`));
    }

    return payment;
  }

  /**
   * 일반 결제 확정: PortOne V2 API로 서버 측 금액·상태 재검증 후 completed 처리
   */
  async confirmPayment(
    paymentId: string,
    userId: string,
    externalPaymentId: string,
  ): Promise<Payment> {
    const payment = await this.verifyAndLoadPendingPayment(paymentId, userId, externalPaymentId);
    payment.status = PaymentStatus.COMPLETED;
    payment.externalPaymentId = externalPaymentId;
    return this.paymentRepository.save(payment);
  }

  /**
   * 빌링키 발급 확정 (정기결제/구독용)
   * 프론트에서 PortOne SDK requestIssueBillingKey 완료 후 호출.
   * requestIssueBillingKey는 결제를 생성하지 않으므로(빌링키만 발급)
   * PortOne 결제 조회(verifyPayment) 대신 빌링키 존재 여부를 검증한다.
   */
  async confirmBillingKeyPayment(
    paymentId: string,
    userId: string,
    externalPaymentId: string,
    billingKey: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new RpcException(new NotFoundException("결제 내역을 찾을 수 없습니다"));
    if (payment.userId !== userId) {
      throw new RpcException(new ForbiddenException("본인의 결제만 처리할 수 있습니다"));
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new RpcException(new BadRequestException("이미 처리된 결제입니다"));
    }

    // PortOne에 빌링키가 실제로 존재하고 삭제되지 않았는지 검증
    try {
      const bk = await this.portoneService.getBillingKey(billingKey);
      if (bk.deletedAt) {
        throw new Error("삭제된 빌링키입니다");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "빌링키 검증 실패";
      throw new RpcException(new BadRequestException(`빌링키 검증 실패: ${msg}`));
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.externalPaymentId = externalPaymentId;
    payment.billingKey = billingKey;
    return this.paymentRepository.save(payment);
  }

  /**
   * 빌링키로 정기 청구 (구독 갱신 등 서버 주도 결제)
   */
  async chargeSubscription(params: {
    userId: string;
    billingKey: string;
    amount: number;
    orderName: string;
    type: PaymentType;
    metadata?: Record<string, unknown>;
  }): Promise<Payment> {
    const orderId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const payment = this.paymentRepository.create({
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      status: PaymentStatus.PENDING,
      externalOrderId: orderId,
      billingKey: params.billingKey,
      metadata: params.metadata,
    });
    await this.paymentRepository.save(payment);

    try {
      const pgPayment = await this.portoneService.chargeWithBillingKey({
        paymentId: orderId,
        billingKey: params.billingKey,
        orderName: params.orderName,
        totalAmount: params.amount,
        customerId: params.userId,
      });

      payment.status = PaymentStatus.COMPLETED;
      payment.externalPaymentId = pgPayment.id;
      return this.paymentRepository.save(payment);
    } catch (e: unknown) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      const msg = e instanceof Error ? e.message : "정기 청구 실패";
      throw new RpcException(new BadRequestException(`정기 청구 실패: ${msg}`));
    }
  }

  /**
   * 웹훅으로 결제 상태 동기화
   * PortOne이 status 변경 시 서버로 푸시하는 이벤트를 처리
   */
  async handleWebhook(portonePaymentId: string): Promise<void> {
    const pgPayment = await this.portoneService.getPayment(portonePaymentId);

    // externalPaymentId(confirm 후 저장)로 우선 조회하고, confirm 전에 끊긴 결제(크래시 등)를
    // 복구할 수 있도록 externalOrderId(생성 시 PortOne paymentId로 그대로 사용된 값)도 함께 조회한다.
    const payment = await this.paymentRepository.findOne({
      where: [{ externalPaymentId: portonePaymentId }, { externalOrderId: portonePaymentId }],
    });
    if (!payment) return; // 아직 confirm 전이거나 미등록 결제 — 무시

    if (pgPayment.status === "PAID" && payment.status === PaymentStatus.PENDING) {
      payment.status = PaymentStatus.COMPLETED;
      payment.externalPaymentId = portonePaymentId;
      await this.paymentRepository.save(payment);
    } else if (
      (pgPayment.status === "CANCELLED" || pgPayment.status === "FAILED") &&
      payment.status !== PaymentStatus.REFUNDED
    ) {
      payment.status =
        pgPayment.status === "CANCELLED" ? PaymentStatus.REFUNDED : PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
    }
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

    // PortOne V2 서버 측 결제 취소 (PG사 실제 환불 처리)
    if (payment.externalPaymentId) {
      try {
        await this.portoneService.cancelPayment(payment.externalPaymentId, "사용자 요청 환불");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "PG사 환불 처리 실패";
        throw new RpcException(new BadRequestException(`환불 처리 실패: ${msg}`));
      }
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
