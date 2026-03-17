import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";

import { MARKETPLACE_EVENTS, PAYMENT_EVENTS } from "@tone-knob/shared";

import { MarketplaceService } from "./marketplace/marketplace.service";
import { PaymentService } from "./payment/payment.service";
import { SettlementService } from "./settlement/settlement.service";

@Controller()
export class MarketplaceSvcController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly paymentService: PaymentService,
    private readonly settlementService: SettlementService,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
  ) {}

  // ─── Marketplace ───

  @MessagePattern("marketplace.listPaidTabs")
  async listPaidTabs(@Payload() data: { page?: number; limit?: number }) {
    return this.marketplaceService.listPaidTabs(data.page, data.limit);
  }

  @MessagePattern("marketplace.setPrice")
  async setPrice(
    @Payload() data: { tabId: string; userId: string; price: number },
  ) {
    return this.marketplaceService.setPrice(
      data.tabId,
      data.userId,
      data.price,
    );
  }

  @MessagePattern("marketplace.purchase")
  async purchase(@Payload() data: { tabId: string; buyerId: string }) {
    const purchase = await this.marketplaceService.purchase(
      data.tabId,
      data.buyerId,
    );
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
  async getMyPurchases(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.marketplaceService.getMyPurchases(
      data.userId,
      data.page,
      data.limit,
    );
  }

  @MessagePattern("marketplace.getMySales")
  async getMySales(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.marketplaceService.getMySales(
      data.userId,
      data.page,
      data.limit,
    );
  }

  // ─── Payment ───

  @MessagePattern("payment.create")
  async createPayment(
    @Payload()
    data: {
      userId: string;
      type: string;
      amount: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.paymentService.createPayment(data.userId, data as any);
  }

  @MessagePattern("payment.confirm")
  async confirmPayment(
    @Payload() data: { paymentId: string; externalPaymentId: string },
  ) {
    const payment = await this.paymentService.confirmPayment(
      data.paymentId,
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

  @MessagePattern("payment.refund")
  async refundPayment(@Payload() data: { paymentId: string }) {
    return this.paymentService.refundPayment(data.paymentId);
  }

  @MessagePattern("payment.getById")
  async getPayment(@Payload() data: { paymentId: string }) {
    return this.paymentService.getPaymentById(data.paymentId);
  }

  @MessagePattern("payment.getMyPayments")
  async getMyPayments(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.paymentService.getMyPayments(
      data.userId,
      data.page,
      data.limit,
    );
  }

  // ─── Settlement ───

  @MessagePattern("settlement.request")
  async requestSettlement(@Payload() data: { sellerId: string }) {
    return this.settlementService.requestSettlement(data.sellerId);
  }

  @MessagePattern("settlement.getMy")
  async getMySettlements(
    @Payload() data: { sellerId: string; page?: number; limit?: number },
  ) {
    return this.settlementService.getMySettlements(
      data.sellerId,
      data.page,
      data.limit,
    );
  }

  @MessagePattern("settlement.summary")
  async getSummary(@Payload() data: { sellerId: string }) {
    return this.settlementService.getSummary(data.sellerId);
  }
}
