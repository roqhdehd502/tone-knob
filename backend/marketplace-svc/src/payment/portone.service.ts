import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** PortOne V2 REST API 기반 결제 검증/빌링키 청구 서비스 */
@Injectable()
export class PortoneService {
  private readonly logger = new Logger(PortoneService.name);
  private readonly apiBase = "https://api.portone.io";
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.apiSecret = this.configService.getOrThrow<string>("PORTONE_API_SECRET");
  }

  private authHeader() {
    return { Authorization: `PortOne ${this.apiSecret}` };
  }

  /**
   * PortOne V2 결제 단건 조회
   * GET /payments/{paymentId}
   */
  async getPayment(portonePaymentId: string): Promise<PortonePayment> {
    const res = await fetch(`${this.apiBase}/payments/${encodeURIComponent(portonePaymentId)}`, {
      headers: this.authHeader(),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`PortOne getPayment failed: ${res.status} ${body}`);
      throw new Error(`PortOne getPayment failed: ${res.status}`);
    }
    return res.json() as Promise<PortonePayment>;
  }

  /**
   * PortOne V2 결제 검증
   * — DB 저장 금액과 PG사 응답 금액이 일치하고, status가 PAID인지 확인
   */
  async verifyPayment(portonePaymentId: string, expectedAmount: number): Promise<PortonePayment> {
    const payment = await this.getPayment(portonePaymentId);

    if (payment.status !== "PAID") {
      throw new Error(`결제 상태가 PAID가 아닙니다: ${payment.status}`);
    }
    if (payment.amount.total !== expectedAmount) {
      throw new Error(`결제 금액 불일치: 기대=${expectedAmount}, 실제=${payment.amount.total}`);
    }
    return payment;
  }

  /**
   * PortOne V2 빌링키로 결제 청구
   * POST /payments/{paymentId}/billing-key
   */
  async chargeWithBillingKey(params: {
    paymentId: string;
    billingKey: string;
    orderName: string;
    totalAmount: number;
    currency?: string;
    customerId?: string;
  }): Promise<PortonePayment> {
    const body = {
      billingKey: params.billingKey,
      orderName: params.orderName,
      amount: { total: params.totalAmount },
      currency: params.currency ?? "KRW",
      customer: params.customerId ? { id: params.customerId } : undefined,
    };

    const res = await fetch(
      `${this.apiBase}/payments/${encodeURIComponent(params.paymentId)}/billing-key`,
      {
        method: "POST",
        headers: { ...this.authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const errBody = await res.text();
      this.logger.error(`PortOne chargeWithBillingKey failed: ${res.status} ${errBody}`);
      throw new Error(`PortOne chargeWithBillingKey failed: ${res.status}`);
    }
    return res.json() as Promise<PortonePayment>;
  }

  /**
   * PortOne V2 결제 취소(환불)
   * POST /payments/{paymentId}/cancel
   */
  async cancelPayment(portonePaymentId: string, reason: string): Promise<PortonePayment> {
    const res = await fetch(
      `${this.apiBase}/payments/${encodeURIComponent(portonePaymentId)}/cancel`,
      {
        method: "POST",
        headers: { ...this.authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`PortOne cancelPayment failed: ${res.status} ${body}`);
      throw new Error(`PortOne cancelPayment failed: ${res.status}`);
    }
    return res.json() as Promise<PortonePayment>;
  }

  /**
   * 빌링키 단건 조회
   * GET /billing-keys/{billingKey}
   */
  async getBillingKey(billingKey: string): Promise<PortoneBillingKey> {
    const res = await fetch(`${this.apiBase}/billing-keys/${encodeURIComponent(billingKey)}`, {
      headers: this.authHeader(),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`PortOne getBillingKey failed: ${res.status} ${body}`);
      throw new Error(`PortOne getBillingKey failed: ${res.status}`);
    }
    return res.json() as Promise<PortoneBillingKey>;
  }

  /**
   * 빌링키 삭제 (구독 취소 시 선택적으로 호출)
   * DELETE /billing-keys/{billingKey}
   */
  async deleteBillingKey(billingKey: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/billing-keys/${encodeURIComponent(billingKey)}`, {
      method: "DELETE",
      headers: this.authHeader(),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.warn(`PortOne deleteBillingKey failed: ${res.status} ${body}`);
    }
  }

  /**
   * 웹훅 서명 검증
   * PortOne이 전송한 Webhook-Signature 헤더 값을 검증
   * (PORTONE_WEBHOOK_SECRET 미설정 시 검증 생략)
   */
  async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    const secret = this.configService.get<string>("PORTONE_WEBHOOK_SECRET");
    if (!secret) return true; // 시크릿 미설정 시 허용 (개발 환경)

    const { createHmac } = await import("crypto");
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    return signature === expected;
  }
}

// ─── PortOne V2 타입 정의 ────────────────────────────────────────

export interface PortonePayment {
  id: string;
  transactionId: string;
  merchantId: string;
  storeId: string;
  paymentId: string;
  orderName: string;
  currency: string;
  amount: {
    total: number;
    taxFree: number;
    vat: number;
    supply: number;
    discount: number;
    paid: number;
    cancelled: number;
    cancelledTaxFree: number;
  };
  status:
    | "READY"
    | "PENDING"
    | "VIRTUAL_ACCOUNT_ISSUED"
    | "PAID"
    | "FAILED"
    | "PARTIAL_CANCELLED"
    | "CANCELLED";
  paidAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  channel?: {
    type: string;
    id: string;
    key: string;
    name: string;
    pgProvider: string;
    pgMerchantId: string;
  };
  pgTxId?: string;
  pgResponse?: string;
  receiptUrl?: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
}

export interface PortoneBillingKey {
  billingKey: string;
  storeId: string;
  merchantId: string;
  issuedAt: string;
  deletedAt?: string;
  methods?: {
    type: string;
    card?: {
      publisher?: string;
      issuer?: string;
      brand?: string;
      type?: string;
      ownerType?: string;
      bin?: string;
      name?: string;
      number?: string;
    };
  }[];
  channel: {
    type: string;
    id: string;
    key: string;
    name: string;
    pgProvider: string;
    pgMerchantId: string;
  };
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
}
