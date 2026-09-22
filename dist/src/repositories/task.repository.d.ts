import { Task } from '@prisma/client';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { CreateTaskInput, UpdateTaskInput, TaskFilterParams } from '../types/task.types';
import { PaginatedResult } from '../types/common.types';
export declare class TaskRepository implements ITaskRepository {
    findById(id: string): Promise<Task | null>;
    findMany(filters: TaskFilterParams): Promise<PaginatedResult<Task>>;
    create(data: CreateTaskInput): Promise<Task>;
    update(id: string, data: UpdateTaskInput): Promise<Task>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    countByProject(projectId: string): Promise<Record<string, number>>;
}
export declare const taskRepository: TaskRepository;
