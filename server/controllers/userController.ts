import type { Request, Response } from 'express';
import userModel from '../models/User.js';
import type { User } from '../types/User.js';

const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, name, password } = req.body;

        // Input validation
        if (!email || !password) {
            res.status(400).json({
                error: 'Email and password are required'
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                error: 'Please provide a valid email address'
            });
            return;
        }

        // Password length validation
        if (password.length < 6) {
            res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
            return;
        }

        const user = await userModel.createUser({
            email: email,
            name: name || null,
            password: password
        } as User);

        res.status(201).json({
            message: 'User created successfully',
            user: user
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error meta:', error.meta);

        // Handle Prisma unique constraint error (duplicate email)
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            res.status(409).json({
                error: 'Email already exists'
            });
            return;
        }

        // Handle other Prisma errors
        if (error.code && error.code.startsWith('P')) {
            res.status(400).json({
                error: `Database error: ${error.message}`,
                code: error.code
            });
            return;
        }

        // Generic error
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};

export default {
    registerUser,
};