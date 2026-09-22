import { JwtPayload } from 'jsonwebtoken';
export interface TokenPayload {
    sub: string;
    email: string;
    name: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare const signToken: (payload: Omit<TokenPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => TokenPayload;
export declare const decodeToken: (token: string) => JwtPayload | string | null;
