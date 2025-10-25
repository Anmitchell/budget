import type { Request, Response } from 'express';
import userModel from '../models/UserModel.js';
import type { RegisterUser } from '../types/User.js';
import { Prisma } from '@prisma/client';

const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.body is already validated by middleware at this point
        const { firstName, lastName, email, password } = req.body;

        // Register the user
        const user = await userModel.CreateUser({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
        } as RegisterUser);

        // Return the user data to the client
        res.status(201).json({
            message: 'User created successfully',
            user: user
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Registration error:', error.message);
        } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('Registration error:', error.message);
        } else {
            console.error('Registration error:', error);
        }

        // Handle Prisma unique constraint error (duplicate email)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && (error.meta as { target?: string[]; })?.target?.includes('email')) {
            res.status(409).json({
                error: 'Email already exists'
            });
            return;
        }

        // Handle other Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code.startsWith('P')) {
            res.status(400).json({
                error: `Database error: ${error.message}`,
                code: error.code
            });
            return;
        }

        // Generic error
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export default {
    registerUser,
};
