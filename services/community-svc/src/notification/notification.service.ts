import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(data: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    referenceId?: string;
    message: string;
  }): Promise<Notification> {
    // recipientId === actorId 케이스(AI_JOB, PAYMENT, BADGE 등 시스템 알림)는
    // 의도된 자기 알림이므로 차단하지 않는다. 다른 사용자의 행동에 대한 알림은
    // 호출부(event-handler.controller 등)에서 자기 자신인 경우를 이미 걸러서 호출한다.
    const notification = this.notificationRepository.create({
      recipientId: data.recipientId,
      actorId: data.actorId,
      type: data.type,
      referenceId: data.referenceId ?? null,
      message: data.message,
    });
    return this.notificationRepository.save(notification);
  }

  async getByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { recipientId: userId },
        relations: ['actor'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    const unreadCount = await this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<{ success: true }> {
    await this.notificationRepository.update(
      { id: notificationId, recipientId: userId },
      { isRead: true },
    );
    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<{ success: true }> {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async delete(notificationId: string, userId: string): Promise<{ success: true }> {
    await this.notificationRepository.delete({
      id: notificationId,
      recipientId: userId,
    });
    return { success: true };
  }
}
