import { ProductivityActivity, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { IActivityRepository } from '../interfaces/IActivityRepository';
import { CreateActivityInput, ActivityFilterParams } from '../types/activity.types';
import { PaginatedResult } from '../types/common.types';

export class ActivityRepository implements IActivityRepository {
  async findById(id: string): Promise<ProductivityActivity | null> {
    return prisma.productivityActivity.findUnique({ where: { id } });
  }

  async findMany(filters: ActivityFilterParams): Promise<PaginatedResult<ProductivityActivity>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      taskId,
      type,
      from,
      to,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductivityActivityWhereInput = {
      ...(userId && { userId }),
      ...(taskId && { taskId }),
      ...(type && { type }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.productivityActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.productivityActivity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as ProductivityActivity[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async create(data: CreateActivityInput): Promise<ProductivityActivity> {
    return prisma.productivityActivity.create({ data });
  }

  async delete(id: string): Promise<void> {
    await prisma.productivityActivity.delete({ where: { id } });
  }

  async getTotalScore(userId: string, from?: Date, to?: Date): Promise<number> {
    const result = await prisma.productivityActivity.aggregate({
      where: {
        userId,
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      _sum: { scoreImpact: true },
    });

    return result._sum.scoreImpact ?? 0;
  }
}

export const activityRepository = new ActivityRepository();
