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
    // 자기 자신에게 알림 보내지 않음
    if (data.recipientId === data.actorId)
      return null as unknown as Notification;

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

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, recipientId: userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({
      id: notificationId,
      recipientId: userId,
    });
  }
}
