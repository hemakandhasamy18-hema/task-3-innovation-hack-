import { Task } from '@prisma/client';
import { CreateTaskInput, UpdateTaskInput, TaskFilterParams } from '../types/task.types';
import { PaginatedResult } from '../types/common.types';
export declare const taskService: {
    /**
     * TRANSACTION: Create task + log TASK_CREATED activity atomically.
     */
    create(data: CreateTaskInput): Promise<Task>;
    getById(id: string): Promise<Task>;
    getMany(filters: TaskFilterParams): Promise<PaginatedResult<Task>>;
    update(id: string, data: UpdateTaskInput, requesterId: string): Promise<Task>;
    /**
     * TRANSACTION: Mark task DONE + log TASK_COMPLETED activity + notify creator.
     */
    complete(id: string, actualHours: number | undefined, requesterId: string): Promise<Task>;
    delete(id: string): Promise<void>;
    getProjectStats(projectId: string): Promise<Record<string, number>>;
};
