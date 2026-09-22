import { Notification } from '@prisma/client';
import { INotificationRepository } from '../interfaces/INotificationRepository';
import { CreateNotificationInput, NotificationFilterParams } from '../types/notification.types';
import { PaginatedResult } from '../types/common.types';
export declare class NotificationRepository implements INotificationRepository {
    findById(id: string): Promise<Notification | null>;
    findMany(filters: NotificationFilterParams): Promise<PaginatedResult<Notification>>;
    create(data: CreateNotificationInput): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<number>;
    delete(id: string): Promise<void>;
    countUnread(userId: string): Promise<number>;
}
export declare const notificationRepository: NotificationRepository;
