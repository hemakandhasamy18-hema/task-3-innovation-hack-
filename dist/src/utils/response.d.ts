import { Response } from 'express';
import { ApiResponse } from '../types/common.types';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, pagination?: ApiResponse["pagination"]) => void;
export declare const sendError: (res: Response, message: string, statusCode?: number, code?: string, details?: unknown) => void;
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => void;
