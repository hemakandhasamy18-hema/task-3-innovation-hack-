import { ProductivityActivity } from '@prisma/client';
import {
  CreateActivityInput,
  ActivityFilterParams,
} from '../types/activity.types';
import { PaginatedResult } from '../types/common.types';

export interface IActivityRepository {
  findById(id: string): Promise<ProductivityActivity | null>;
  findMany(filters: ActivityFilterParams): Promise<PaginatedResult<ProductivityActivity>>;
  create(data: CreateActivityInput): Promise<ProductivityActivity>;
  delete(id: string): Promise<void>;
  getTotalScore(userId: string, from?: Date, to?: Date): Promise<number>;
}
