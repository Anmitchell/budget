import { z } from 'zod';

// User registration schema with email and password validation
export const userRegistrationSchema = z.object({
    firstName: z
        .string()
        .min(1, { error: 'Name cannot be empty' })
        .max(100, { error: 'Name must be less than 100 characters' }),

    lastName: z
        .string()
        .min(1, { error: 'Last name cannot be empty' })
        .max(100, { error: 'Last name must be less than 100 characters' }),

    email: z.email({ error: 'Please provide a valid email address' }),

    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .refine((val) => /[A-Z]/.test(val), { error: 'Password must contain at least one uppercase letter' })
        .refine((val) => /[a-z]/.test(val), { error: 'Password must contain at least one lowercase letter' })
        .refine((val) => /\d/.test(val), { error: 'Password must contain at least one number' })
        .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), { error: 'Password must contain at least one special character' }),

    confirmPassword: z
        .string()
        .min(8, 'Confirm password must be at least 8 characters long')
        .refine((val) => /[A-Z]/.test(val), { error: 'Confirm password must contain at least one uppercase letter' })
        .refine((val) => /[a-z]/.test(val), { error: 'Confirm password must contain at least one lowercase letter' })
        .refine((val) => /\d/.test(val), { error: 'Confirm password must contain at least one number' })
        .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), { error: 'Confirm password must contain at least one special character' }),
});

// Type inference for TypeScript
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;