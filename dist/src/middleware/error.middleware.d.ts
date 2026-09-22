import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    readonly details?: unknown;
    constructor(message: string, statusCode?: number, code?: string, details?: unknown, isOperational?: boolean);
}
export declare const notFound: (_req: Request, _res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => void;
