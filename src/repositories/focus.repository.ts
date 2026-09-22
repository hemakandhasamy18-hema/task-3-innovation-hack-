import { FocusSession, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { IFocusRepository } from '../interfaces/IFocusRepository';
import { CreateFocusSessionInput, FocusSessionFilterParams } from '../types/focus.types';
import { PaginatedResult } from '../types/common.types';

export class FocusRepository implements IFocusRepository {
  async findById(id: string): Promise<FocusSession | null> {
    return prisma.focusSession.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
    }) as unknown as FocusSession | null;
  }

  async findMany(filters: FocusSessionFilterParams): Promise<PaginatedResult<FocusSession>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'completedAt',
      sortOrder = 'desc',
      userId,
      taskId,
      energyLevel,
      from,
      to,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.FocusSessionWhereInput = {
      ...(userId && { userId }),
      ...(taskId && { taskId }),
      ...(energyLevel && { energyLevel }),
      ...(from || to
        ? {
            completedAt: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.focusSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.focusSession.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as FocusSession[],
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

  async create(data: CreateFocusSessionInput): Promise<FocusSession> {
    return prisma.focusSession.create({ data });
  }

  async delete(id: string): Promise<void> {
    await prisma.focusSession.delete({ where: { id } });
  }

  async getTotalFocusMinutes(userId: string, from?: Date, to?: Date): Promise<number> {
    const result = await prisma.focusSession.aggregate({
      where: {
        userId,
        ...(from || to
          ? {
              completedAt: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      _sum: { durationMinutes: true },
    });

    return result._sum.durationMinutes ?? 0;
  }

  async getAverageDuration(userId: string): Promise<number> {
    const result = await prisma.focusSession.aggregate({
      where: { userId },
      _avg: { durationMinutes: true },
    });

    return result._avg.durationMinutes ?? 0;
  }
}

export const focusRepository = new FocusRepository();
