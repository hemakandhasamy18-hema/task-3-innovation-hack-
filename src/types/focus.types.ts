import { EnergyLevel } from '@prisma/client';
import { PaginationParams } from './common.types';

export interface FocusSessionDTO {
  id: string;
  userId: string;
  taskId: string | null;
  durationMinutes: number;
  distractionsCount: number;
  notes: string | null;
  energyLevel: EnergyLevel | null;
  completedAt: Date;
  createdAt: Date;
}

export interface CreateFocusSessionInput {
  userId: string;
  taskId?: string | null;
  durationMinutes: number;
  distractionsCount?: number;
  notes?: string | null;
  energyLevel?: EnergyLevel | null;
  completedAt?: Date;
}

export interface FocusSessionFilterParams extends PaginationParams {
  userId?: string;
  taskId?: string;
  energyLevel?: EnergyLevel;
  from?: Date;
  to?: Date;
}
