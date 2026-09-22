import { Notification } from '@prisma/client';
import { CreateNotificationInput, NotificationFilterParams } from '../types/notification.types';
import { PaginatedResult } from '../types/common.types';
export interface INotificationRepository {
    findById(id: string): Promise<Notification | null>;
    findMany(filters: NotificationFilterParams): Promise<PaginatedResult<Notification>>;
    create(data: CreateNotificationInput): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<number>;
    delete(id: string): Promise<void>;
    countUnread(userId: string): Promise<number>;
}
