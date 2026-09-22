import { Notification, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { CreateNotificationInput, NotificationFilterParams } from '../types/notification.types';
import { PaginatedResult } from '../types/common.types';

export class NotificationRepository implements INotificationRepository {
  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findMany(filters: NotificationFilterParams): Promise<PaginatedResult<Notification>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      type,
      isRead,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      ...(userId && { userId }),
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({ where: { id } });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }
}

export const notificationRepository = new NotificationRepository();
