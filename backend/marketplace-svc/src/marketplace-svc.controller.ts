import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";
import { MARKETPLACE_EVENTS, PAYMENT_EVENTS } from "@tone-knob/shared";

import { PaymentType } from "./entities/payment.entity";
import { KnobService } from "./knob/knob.service";
import { MarketplaceService } from "./marketplace/marketplace.service";
import { PaymentService } from "./payment/payment.service";
import { SettlementService } from "./settlement/settlement.service";

@Controller()
export class MarketplaceSvcController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly paymentService: PaymentService,
    private readonly settlementService: SettlementService,
    private readonly knobService: KnobService,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
  ) {}

  // ─── Marketplace ───

  @MessagePattern("marketplace.listPaidTabs")
  async listPaidTabs(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      sort?: "popular" | "oldest" | "newest";
    },
  ) {
    return this.marketplaceService.listPaidTabs(data.page, data.limit, data.sort);
  }

  @MessagePattern("marketplace.setPrice")
  async setPrice(@Payload() data: { tabId: string; userId: string; price: number }) {
    const tab = await this.marketplaceService.setPrice(data.tabId, data.userId, data.price);
    this.communityClient.emit(MARKETPLACE_EVENTS.TAB_LISTED, {
      tabId: data.tabId,
      sellerId: data.userId,
      price: data.price,
    });
    return tab;
  }

  @MessagePattern("marketplace.purchase")
  async purchase(@Payload() data: { tabId: string; buyerId: string }) {
    const purchase = await this.marketplaceService.purchase(data.tabId, data.buyerId);
    this.communityClient.emit(MARKETPLACE_EVENTS.TAB_PURCHASED, {
      purchaseId: purchase.id,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      tabId: purchase.tabId,
      price: purchase.price,
    });
    return purchase;
  }

  @MessagePattern("marketplace.hasPurchased")
  async hasPurchased(@Payload() data: { tabId: string; userId: string }) {
    return this.marketplaceService.hasPurchased(data.tabId, data.userId);
  }

  @MessagePattern("marketplace.getMyPurchases")
  async getMyPurchases(@Payload() data: { userId: string; page?: number; limit?: number }) {
    return this.marketplaceService.getMyPurchases(data.userId, data.page, data.limit);
  }

  @MessagePattern("marketplace.getMySales")
  async getMySales(@Payload() data: { userId: string; page?: number; limit?: number }) {
    return this.marketplaceService.getMySales(data.userId, data.page, data.limit);
  }

  // ─── Payment ───

  @MessagePattern("payment.create")
  async createPayment(
    @Payload()
    data: {
      userId: string;
      type: PaymentType;
      amount: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.paymentService.createPayment(data.userId, data);
  }

  @MessagePattern("payment.confirm")
  async confirmPayment(
    @Payload() data: { paymentId: string; userId: string; externalPaymentId: string },
  ) {
    const payment = await this.paymentService.confirmPayment(
      data.paymentId,
      data.userId,
      data.externalPaymentId,
    );
    this.communityClient.emit(PAYMENT_EVENTS.COMPLETED, {
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      type: payment.type,
      referenceId: payment.id,
    });
    return payment;
  }

  @MessagePattern("payment.confirmBillingKey")
  async confirmBillingKeyPayment(
    @Payload()
    data: {
      paymentId: string;
      userId: string;
      externalPaymentId: string;
      billingKey: string;
    },
  ) {
    const payment = await this.paymentService.confirmBillingKeyPayment(
      data.paymentId,
      data.userId,
      data.externalPaymentId,
      data.billingKey,
    );
    this.communityClient.emit(PAYMENT_EVENTS.COMPLETED, {
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      type: payment.type,
      referenceId: payment.id,
    });
    return payment;
  }

  @MessagePattern("payment.webhook")
  async handleWebhook(@Payload() data: { portonePaymentId: string }) {
    await this.paymentService.handleWebhook(data.portonePaymentId);
    return { ok: true };
  }

  @MessagePattern("payment.refund")
  async refundPayment(@Payload() data: { paymentId: string; userId: string }) {
    const payment = await this.paymentService.refundPayment(data.paymentId, data.userId);
    this.communityClient.emit(PAYMENT_EVENTS.REFUNDED, {
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
    });
    return payment;
  }

  @MessagePattern("payment.getById")
  async getPayment(@Payload() data: { paymentId: string; userId: string }) {
    return this.paymentService.getPaymentById(data.paymentId, data.userId);
  }

  @MessagePattern("payment.getMyPayments")
  async getMyPayments(@Payload() data: { userId: string; page?: number; limit?: number }) {
    return this.paymentService.getMyPayments(data.userId, data.page, data.limit);
  }

  // ─── Settlement ───

  @MessagePattern("settlement.request")
  async requestSettlement(@Payload() data: { sellerId: string }) {
    return this.settlementService.requestSettlement(data.sellerId);
  }

  @MessagePattern("settlement.getMy")
  async getMySettlements(@Payload() data: { sellerId: string; page?: number; limit?: number }) {
    return this.settlementService.getMySettlements(data.sellerId, data.page, data.limit);
  }

  @MessagePattern("settlement.summary")
  async getSummary(@Payload() data: { sellerId: string }) {
    return this.settlementService.getSummary(data.sellerId);
  }

  // ─── Knob ───

  @MessagePattern("knob.getBalance")
  async getKnobBalance(@Payload() data: { userId: string }) {
    const balance = await this.knobService.getBalance(data.userId);
    return { balance };
  }

  @MessagePattern("knob.getHistory")
  async getKnobHistory(@Payload() data: { userId: string; page?: number; limit?: number }) {
    return this.knobService.getHistory(data.userId, data.page, data.limit);
  }
}
