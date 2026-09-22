import { User } from '@prisma/client';
import { UserDTO } from '../types/user.types';
export declare const authService: {
    register(data: {
        name: string;
        email: string;
        password: string;
        role?: User["role"];
    }): Promise<{
        user: UserDTO;
        token: string;
    }>;
    login(data: {
        email: string;
        password: string;
    }): Promise<{
        user: UserDTO;
        token: string;
    }>;
    refreshProfile(userId: string): Promise<UserDTO>;
};
