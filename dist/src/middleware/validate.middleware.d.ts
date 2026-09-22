import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';
type ValidateTarget = 'body' | 'query' | 'params';
export declare const validate: (schema: AnyZodObject, target?: ValidateTarget) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateAll: (schemas: {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export {};
