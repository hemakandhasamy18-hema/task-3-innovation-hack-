import { User } from '@prisma/client';
import { CreateUserInput, UpdateUserInput, UserFilterParams } from '../types/user.types';
import { PaginatedResult } from '../types/common.types';
export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findMany(filters: UserFilterParams): Promise<PaginatedResult<User>>;
    create(data: CreateUserInput): Promise<User>;
    update(id: string, data: UpdateUserInput): Promise<User>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
}
