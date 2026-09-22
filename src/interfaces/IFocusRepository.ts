import { FocusSession } from '@prisma/client';
import {
  CreateFocusSessionInput,
  FocusSessionFilterParams,
} from '../types/focus.types';
import { PaginatedResult } from '../types/common.types';

export interface IFocusRepository {
  findById(id: string): Promise<FocusSession | null>;
  findMany(filters: FocusSessionFilterParams): Promise<PaginatedResult<FocusSession>>;
  create(data: CreateFocusSessionInput): Promise<FocusSession>;
  delete(id: string): Promise<void>;
  getTotalFocusMinutes(userId: string, from?: Date, to?: Date): Promise<number>;
  getAverageDuration(userId: string): Promise<number>;
}
