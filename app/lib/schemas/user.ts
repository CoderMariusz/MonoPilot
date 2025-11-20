import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'admin',
  'manager',
  'operator',
  'viewer',
  'planner',
  'technical',
  'purchasing',
  'warehouse',
  'qc',
  'finance',
]);

export const UserStatusEnum = z.enum(['invited', 'active', 'inactive']);

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  first_name: z.string().min(1, 'First name required').max(50),
  last_name: z.string().min(1, 'Last name required').max(50),
  role: UserRoleEnum,
});

export const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional(),
});

export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
