import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';

import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';
import { sendSuccess, sendCreated } from './utils/response';
import { authenticate, authorize } from './middleware/auth.middleware';
import { validate, validateAll, uuidParamSchema } from './middleware/validate.middleware';
import { notFound, errorHandler } from './middleware/error.middleware';

import { authService } from './services/auth.service';
import { userService } from './services/user.service';
import { projectService } from './services/project.service';
import { taskService } from './services/task.service';
import { focusRepository } from './repositories/focus.repository';
import { activityRepository } from './repositories/activity.repository';
import { notificationRepository } from './repositories/notification.repository';
import { analyticsRepository } from './repositories/analytics.repository';

const app = express();

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: 'ok', database: 'connected', uptime: process.uptime() });
  } catch {
    res.status(503).json({ success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } });
  }
});

// ---------------------------------------------------------------------------
// Auth validation schemas
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Auth routes  /api/auth
// ---------------------------------------------------------------------------
const authRouter = express.Router();

authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendCreated(res, result, 'Registration successful');
  } catch (err) { next(err); }
});

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (err) { next(err); }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.refreshProfile(req.user!.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

app.use('/api/auth', authRouter);

// ---------------------------------------------------------------------------
// User validation schemas
// ---------------------------------------------------------------------------
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

const userQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']).optional(),
  isActive: z.string().optional().transform((v) => v === 'true'),
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// User routes  /api/users
// ---------------------------------------------------------------------------
const userRouter = express.Router();
userRouter.use(authenticate);

userRouter.get('/', validate(userQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await userService.getMany(req.query as any);
    sendSuccess(res, result.data, undefined, 200, result.pagination);
  } catch (err) { next(err); }
});

userRouter.get('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
});

userRouter.patch('/:id', validateAll({ params: uuidParamSchema, body: updateUserSchema }), async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
});

userRouter.delete('/:id', validate(uuidParamSchema, 'params'), authorize('ADMIN'), async (req, res, next) => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

userRouter.patch('/:id/deactivate', validate(uuidParamSchema, 'params'), authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const user = await userService.deactivate(req.params.id);
    sendSuccess(res, user, 'User deactivated');
  } catch (err) { next(err); }
});

app.use('/api/users', userRouter);

// ---------------------------------------------------------------------------
// Project validation schemas
// ---------------------------------------------------------------------------
const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  ownerId: z.string().uuid(),
  startDate: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  dueDate: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

const updateProjectSchema = createProjectSchema.omit({ ownerId: true }).partial();

const projectQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  ownerId: z.string().uuid().optional(),
  search: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'LEAD', 'MEMBER', 'VIEWER']).optional(),
});

// ---------------------------------------------------------------------------
// Project routes  /api/projects
// ---------------------------------------------------------------------------
const projectRouter = express.Router();
projectRouter.use(authenticate);

projectRouter.post('/', validate(createProjectSchema), async (req, res, next) => {
  try {
    const project = await projectService.create(req.body);
    sendCreated(res, project, 'Project created');
  } catch (err) { next(err); }
});

projectRouter.get('/', validate(projectQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await projectService.getMany(req.query as any);
    sendSuccess(res, result.data, undefined, 200, result.pagination);
  } catch (err) { next(err); }
});

projectRouter.get('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const project = await projectService.getById(req.params.id);
    sendSuccess(res, project);
  } catch (err) { next(err); }
});

projectRouter.patch('/:id', validateAll({ params: uuidParamSchema, body: updateProjectSchema }), async (req, res, next) => {
  try {
    const project = await projectService.update(req.params.id, req.body, req.user!.id);
    sendSuccess(res, project, 'Project updated');
  } catch (err) { next(err); }
});

projectRouter.delete('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    await projectService.delete(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

projectRouter.get('/:id/members', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const members = await projectService.getMembers(req.params.id);
    sendSuccess(res, members);
  } catch (err) { next(err); }
});

projectRouter.post('/:id/members', validateAll({ params: uuidParamSchema, body: addMemberSchema }), async (req, res, next) => {
  try {
    await projectService.addMember(req.params.id, req.body.userId, req.body.role ?? 'MEMBER', req.user!.id);
    sendSuccess(res, null, 'Member added');
  } catch (err) { next(err); }
});

projectRouter.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    await projectService.removeMember(req.params.id, req.params.userId, req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

app.use('/api/projects', projectRouter);

// ---------------------------------------------------------------------------
// Task validation schemas
// ---------------------------------------------------------------------------
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  projectId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().nullable(),
  createdById: z.string().uuid(),
  dueDate: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  estimatedHours: z.number().positive().optional(),
});

const updateTaskSchema = createTaskSchema.omit({ projectId: true, createdById: true }).partial();

const taskQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  projectId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
});

const completeTaskSchema = z.object({
  actualHours: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Task routes  /api/tasks
// ---------------------------------------------------------------------------
const taskRouter = express.Router();
taskRouter.use(authenticate);

taskRouter.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.create(req.body);
    sendCreated(res, task, 'Task created');
  } catch (err) { next(err); }
});

taskRouter.get('/', validate(taskQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await taskService.getMany(req.query as any);
    sendSuccess(res, result.data, undefined, 200, result.pagination);
  } catch (err) { next(err); }
});

taskRouter.get('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id);
    sendSuccess(res, task);
  } catch (err) { next(err); }
});

taskRouter.patch('/:id', validateAll({ params: uuidParamSchema, body: updateTaskSchema }), async (req, res, next) => {
  try {
    const task = await taskService.update(req.params.id, req.body, req.user!.id);
    sendSuccess(res, task, 'Task updated');
  } catch (err) { next(err); }
});

taskRouter.post('/:id/complete', validateAll({ params: uuidParamSchema, body: completeTaskSchema }), async (req, res, next) => {
  try {
    const task = await taskService.complete(req.params.id, req.body.actualHours, req.user!.id);
    sendSuccess(res, task, 'Task completed');
  } catch (err) { next(err); }
});

taskRouter.delete('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    await taskService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

taskRouter.get('/project/:projectId/stats', validate(z.object({ projectId: z.string().uuid() }), 'params'), async (req, res, next) => {
  try {
    const stats = await taskService.getProjectStats(req.params.projectId);
    sendSuccess(res, stats);
  } catch (err) { next(err); }
});

app.use('/api/tasks', taskRouter);

// ---------------------------------------------------------------------------
// Focus session validation schemas
// ---------------------------------------------------------------------------
const createFocusSchema = z.object({
  userId: z.string().uuid(),
  taskId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().positive(),
  distractionsCount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  energyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

const focusQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  userId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  from: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  to: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
});

// ---------------------------------------------------------------------------
// Focus routes  /api/focus
// ---------------------------------------------------------------------------
const focusRouter = express.Router();
focusRouter.use(authenticate);

focusRouter.post('/', validate(createFocusSchema), async (req, res, next) => {
  try {
    const session = await focusRepository.create(req.body);
    sendCreated(res, session, 'Focus session logged');
  } catch (err) { next(err); }
});

focusRouter.get('/', validate(focusQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await focusRepository.findMany(req.query as any);
    sendSuccess(res, result.data, undefined, 200, result.pagination);
  } catch (err) { next(err); }
});

focusRouter.get('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const session = await focusRepository.findById(req.params.id);
    if (!session) return void res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
    sendSuccess(res, session);
  } catch (err) { next(err); }
});

focusRouter.delete('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    await focusRepository.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

focusRouter.get('/user/:userId/stats', async (req, res, next) => {
  try {
    const [totalMinutes, avgDuration] = await Promise.all([
      focusRepository.getTotalFocusMinutes(req.params.userId),
      focusRepository.getAverageDuration(req.params.userId),
    ]);
    sendSuccess(res, { totalMinutes, avgDuration });
  } catch (err) { next(err); }
});

app.use('/api/focus', focusRouter);

// ---------------------------------------------------------------------------
// Activity routes  /api/activities
// ---------------------------------------------------------------------------
const activityRouter = express.Router();
activityRouter.use(authenticate);

const activityQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  userId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  type: z.enum(['TASK_CREATED', 'TASK_STARTED', 'TASK_COMPLETED', 'FOCUS_SESSION_COMPLETED', 'COMMENT_ADDED', 'STATUS_CHANGED']).optional(),
});

activityRouter.get('/', validate(activityQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await activityRepository.findMany(req.query as any);
    sendSuccess(res, result.data, undefined, 200, result.pagination);
  } catch (err) { next(err); }
});

activityRouter.get('/user/:userId/score', async (req, res, next) => {
  try {
    const score = await activityRepository.getTotalScore(req.params.userId);
    sendSuccess(res, { score });
  } catch (err) { next(err); }
});

app.use('/api/activities', activityRouter);

// ---------------------------------------------------------------------------
// Notification routes  /api/notifications
// ---------------------------------------------------------------------------
const notificationRouter = express.Router();
notificationRouter.use(authenticate);

const notifQuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  userId: z.string().uuid().optional(),
  isRead: z.string().optional().transform((v) => v === 'true'),
});

notificationRouter.get('/', validate(notifQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await notificationRepository.findMany(req.query as any);
    sendSuccess(res, result.data, undefined, 200, result.pagination);
  } catch (err) { next(err); }
});

notificationRouter.patch('/:id/read', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const notif = await notificationRepository.markAsRead(req.params.id);
    sendSuccess(res, notif, 'Notification marked as read');
  } catch (err) { next(err); }
});

notificationRouter.patch('/user/:userId/read-all', async (req, res, next) => {
  try {
    await notificationRepository.markAllAsRead(req.user!.id);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
});

notificationRouter.delete('/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    await notificationRepository.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

app.use('/api/notifications', notificationRouter);

// ---------------------------------------------------------------------------
// Analytics routes  /api/analytics
// ---------------------------------------------------------------------------
const analyticsRouter = express.Router();
analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard/:userId', async (req, res, next) => {
  try {
    const summary = await analyticsRepository.getUserSummary(req.params.userId);
    sendSuccess(res, summary);
  } catch (err) { next(err); }
});

analyticsRouter.get('/productivity/:userId', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const data = await analyticsRepository.getDailyProductivity(req.params.userId, from, to);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

app.use('/api/analytics', analyticsRouter);

// ---------------------------------------------------------------------------
// 404 + error handling
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📋 Health check: http://localhost:${env.PORT}/health`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

export default app;
