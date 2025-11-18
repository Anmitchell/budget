import type { Prisma, User } from '@prisma/client';

// Re-export Prisma's generated User type for convenience
export type { User };

// RegisterUser: API input for user registration
// Derived from Prisma's UserCreateInput, but only required fields
export type RegisterUser = Pick<
  Prisma.UserCreateInput,
  'firstName' | 'lastName' | 'email' | 'password'
>;

// LoginUser: API input for user login
export type LoginUser = Pick<User, 'email' | 'password'>;
