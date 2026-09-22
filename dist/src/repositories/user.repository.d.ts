import { User } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { CreateUserInput, UpdateUserInput, UserFilterParams } from '../types/user.types';
import { PaginatedResult } from '../types/common.types';
export declare class UserRepository implements IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findMany(filters: UserFilterParams): Promise<PaginatedResult<User>>;
    create(data: CreateUserInput): Promise<User>;
    update(id: string, data: UpdateUserInput): Promise<User>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
}
export declare const userRepository: UserRepository;
