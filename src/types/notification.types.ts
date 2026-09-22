import { NotificationType } from '@prisma/client';
import { PaginationParams } from './common.types';

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

export interface NotificationFilterParams extends PaginationParams {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
}
