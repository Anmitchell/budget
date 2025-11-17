import { prisma } from '../config/database.js';
import type { RegisterUser } from '../types/User.js';
import bcrypt from 'bcrypt';

// Type for database creation (picks only necessary fields)
type CreateUserData = Pick<
  RegisterUser,
  'firstName' | 'lastName' | 'email' | 'password'
>;

// Create a new user
const CreateUser = async (user: RegisterUser) => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(user.password, 10);

  return await prisma.user.create({
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hashedPassword,
    } as CreateUserData,
    // Select only the fields we need to return to the client
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: false,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export default {
  CreateUser,
};
