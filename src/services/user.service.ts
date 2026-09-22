import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/error.middleware';
import { UserDTO, UserFilterParams, UpdateUserInput } from '../types/user.types';
import { PaginatedResult } from '../types/common.types';

function toDTO(user: User): UserDTO {
  const { passwordHash: _omit, ...dto } = user;
  return dto as UserDTO;
}

export const userService = {
  async getById(id: string): Promise<UserDTO> {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return toDTO(user);
  },

  async getMany(filters: UserFilterParams): Promise<PaginatedResult<UserDTO>> {
    const result = await userRepository.findMany(filters);
    return {
      ...result,
      data: result.data.map(toDTO),
    };
  },

  async update(id: string, data: UpdateUserInput & { password?: string }): Promise<UserDTO> {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    // If updating email, check uniqueness
    if (data.email && data.email !== user.email) {
      const emailTaken = await userRepository.existsByEmail(data.email);
      if (emailTaken) throw new AppError('Email is already taken', 409, 'EMAIL_CONFLICT');
    }

    const updatePayload: UpdateUserInput = { ...data };

    // If a new password is provided, hash it
    if (data.password) {
      updatePayload.passwordHash = await hashPassword(data.password);
    }
    delete (updatePayload as any).password;

    const updated = await userRepository.update(id, updatePayload);
    return toDTO(updated);
  },

  async deactivate(id: string): Promise<UserDTO> {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    const updated = await userRepository.update(id, { isActive: false });
    return toDTO(updated);
  },

  async delete(id: string): Promise<void> {
    const exists = await userRepository.exists(id);
    if (!exists) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    await userRepository.delete(id);
  },
};
