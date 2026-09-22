import { UserRole } from '@prisma/client';
import { PaginationParams } from './common.types';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  avatarUrl?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string | null;
}

export interface UserFilterParams extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}
