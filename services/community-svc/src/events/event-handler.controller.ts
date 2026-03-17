import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";

import {
  TAB_EVENTS,
  MARKETPLACE_EVENTS,
  PAYMENT_EVENTS,
  AI_EVENTS,
  TabCreatedEvent,
  TabPublishedEvent,
  TabForkedEvent,
  TabPurchasedEvent,
  PaymentCompletedEvent,
  AiJobCompletedEvent,
  AiJobFailedEvent,
} from "@tone-knob/shared";

import { NotificationType } from "../entities/notification.entity";
import { NotificationService } from "../notification/notification.service";

@Controller()
export class EventHandlerController {
  private readonly logger = new Logger(EventHandlerController.name);

  constructor(private readonly notificationService: NotificationService) {}

  // ─── Tab Events ───

  @EventPattern(TAB_EVENTS.CREATED)
  async handleTabCreated(@Payload() data: TabCreatedEvent) {
    this.logger.log(`Tab created: ${data.tabId} by user ${data.userId}`);
    // 팔로워에게 알림은 publish 시에만 발송 (create 시에는 비공개일 수 있음)
  }

  @EventPattern(TAB_EVENTS.PUBLISHED)
  async handleTabPublished(@Payload() data: TabPublishedEvent) {
    if (!data.isPublished) return;
    this.logger.log(`Tab published: ${data.tabId}`);
    // 팔로워 알림 생성 (향후 팔로워 조회 연동 필요)
    // 현재는 로그만 기록
  }

  @EventPattern(TAB_EVENTS.FORKED)
  async handleTabForked(@Payload() data: TabForkedEvent) {
    this.logger.log(`Tab forked: ${data.tabId} from ${data.originalTabId}`);
    // 원본 타브 작성자에게 알림은 향후 구현
  }

  // ─── Marketplace Events ───

  @EventPattern(MARKETPLACE_EVENTS.TAB_PURCHASED)
  async handleTabPurchased(@Payload() data: TabPurchasedEvent) {
    this.logger.log(`Tab purchased: ${data.tabId} by ${data.buyerId}`);
    await this.notificationService.create({
      recipientId: data.sellerId,
      actorId: data.buyerId,
      type: NotificationType.PURCHASE,
      referenceId: data.tabId,
      message: `회원님의 타브가 구매되었습니다. (₩${data.price.toLocaleString()})`,
    });
  }

  // ─── Payment Events ───

  @EventPattern(PAYMENT_EVENTS.COMPLETED)
  async handlePaymentCompleted(@Payload() data: PaymentCompletedEvent) {
    this.logger.log(`Payment completed: ${data.paymentId}`);
    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.PAYMENT,
      referenceId: data.paymentId,
      message: `결제가 완료되었습니다. (₩${data.amount.toLocaleString()})`,
    });
  }

  // ─── AI Events ───

  @EventPattern(AI_EVENTS.JOB_COMPLETED)
  async handleAiJobCompleted(@Payload() data: AiJobCompletedEvent) {
    this.logger.log(`AI job completed: ${data.jobId}`);
    const typeLabel =
      data.type === "tab_generation" ? "AI 타브 생성" : "오디오 추출";
    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.AI_JOB,
      referenceId: data.jobId,
      message: `${typeLabel} 작업이 완료되었습니다.`,
    });
  }

  @EventPattern(AI_EVENTS.JOB_FAILED)
  async handleAiJobFailed(@Payload() data: AiJobFailedEvent) {
    this.logger.log(`AI job failed: ${data.jobId}`);
    const typeLabel =
      data.type === "tab_generation" ? "AI 타브 생성" : "오디오 추출";
    await this.notificationService.create({
      recipientId: data.userId,
      actorId: data.userId,
      type: NotificationType.AI_JOB,
      referenceId: data.jobId,
      message: `${typeLabel} 작업이 실패했습니다: ${data.errorMessage}`,
    });
  }
}
