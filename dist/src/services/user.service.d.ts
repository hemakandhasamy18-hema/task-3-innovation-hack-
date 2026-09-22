import { UserDTO, UserFilterParams, UpdateUserInput } from '../types/user.types';
import { PaginatedResult } from '../types/common.types';
export declare const userService: {
    getById(id: string): Promise<UserDTO>;
    getMany(filters: UserFilterParams): Promise<PaginatedResult<UserDTO>>;
    update(id: string, data: UpdateUserInput & {
        password?: string;
    }): Promise<UserDTO>;
    deactivate(id: string): Promise<UserDTO>;
    delete(id: string): Promise<void>;
};
