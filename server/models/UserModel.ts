import { prisma } from '../config/database.js';
import type { RegisterUser, LoginUser } from '../types/User.js';
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

// Create a new user
const CreateUser = async (user: RegisterUser) => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(user.password, 10);

  // Type-safe data object that matches Prisma's expected input
  const userData: Prisma.UserCreateInput = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: hashedPassword,
  };

  return await prisma.user.create({
    data: userData,
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

// Login User
const Login = async (user: LoginUser) => {
  const foundUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      createdAt: false,
      updatedAt: false,
    },
  });
  if (!foundUser) {
    throw new Error('User not found');
  }
  const isPasswordValid = await bcrypt.compare(
    user.password,
    foundUser.password
  );
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }
  return foundUser;
};

export default {
  CreateUser,
  Login,
};
