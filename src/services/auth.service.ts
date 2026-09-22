import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { UserDTO } from '../types/user.types';

function toDTO(user: User): UserDTO {
  const { passwordHash: _omit, ...dto } = user;
  return dto as UserDTO;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: User['role'];
  }): Promise<{ user: UserDTO; token: string }> {
    const emailExists = await userRepository.existsByEmail(data.email);
    if (emailExists) {
      throw new AppError('Email is already registered', 409, 'EMAIL_CONFLICT');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user: toDTO(user), token };
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: UserDTO; token: string }> {
    const user = await userRepository.findByEmail(data.email);

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user: toDTO(user), token };
  },

  async refreshProfile(userId: string): Promise<UserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return toDTO(user);
  },
};
