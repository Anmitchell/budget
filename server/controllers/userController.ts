import type { Request, Response } from 'express';
import userModel from '../models/UserModel.js';
import { Prisma } from '@prisma/client';

const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.body is already validated by middleware at this point
    const { firstName, lastName, email, password } = req.body;

    // Register the user
    // Type assertion not needed - validation middleware ensures correct type
    const user = await userModel.CreateUser({
      firstName,
      lastName,
      email,
      password,
    });

    // Return the user data to the client
    res.status(201).json({
      message: 'User created successfully',
      user: user,
    });
  } catch (error: unknown) {
    // Error from validation middleware
    if (error instanceof Error) {
      console.error('Registration error:', error.message);
    } // Error from Prisma
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Registration error:', error.message);
    } // Generic error
    else {
      console.error('Registration error:', error);
    }

    // Handle Prisma unique constraint error (duplicate email)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta as { target?: string[] })?.target?.includes('email')
    ) {
      res.status(409).json({
        error: 'Email already exists',
      });
      return;
    }

    // Handle other Prisma errors
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code.startsWith('P')
    ) {
      res.status(400).json({
        error: `Database error: ${error.message}`,
        code: error.code,
      });
      return;
    }

    // Generic error
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await userModel.Login({ email, password });
    res.status(200).json({
      message: 'Login successful',
      user: user,
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

export default {
  registerUser,
  loginUser,
};
