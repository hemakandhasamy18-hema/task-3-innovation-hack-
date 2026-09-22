import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { AppError } from './error.middleware';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: AnyZodObject, target: ValidateTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new AppError('Validation failed', 422, 'VALIDATION_ERROR', details));
      } else {
        next(err);
      }
    }
  };

// Utility to compose body + params + query validation
export const validateAll =
  (schemas: { body?: AnyZodObject; query?: AnyZodObject; params?: AnyZodObject }) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    for (const [target, schema] of Object.entries(schemas) as [ValidateTarget, AnyZodObject][]) {
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        result.error.errors.forEach((e) =>
          errors.push({ field: `${target}.${e.path.join('.')}`, message: e.message })
        );
      } else {
        req[target] = result.data;
      }
    }

    if (errors.length > 0) {
      next(new AppError('Validation failed', 422, 'VALIDATION_ERROR', errors));
    } else {
      next();
    }
  };

// Common param schemas
export const uuidParamSchema = z.object({ id: z.string().uuid('Invalid UUID format') });
