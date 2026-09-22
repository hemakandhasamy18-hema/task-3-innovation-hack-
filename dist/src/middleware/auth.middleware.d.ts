import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from '../types/common.types';
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
export declare const authorize: (...allowedRoles: AuthenticatedUser["role"][]) => (req: Request, _res: Response, next: NextFunction) => void;
