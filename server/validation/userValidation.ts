import { z } from 'zod';

// User registration schema with email and password validation
// Note: Input sanitization happens before validation, so we can be more lenient here
export const userRegistrationSchema = z.object({
    firstName: z
        .string()
        .min(1, { message: 'First name is required' })
        .max(50, { message: 'First name must be less than 50 characters' })
        .regex(/^[a-zA-Z\s\-'\.]+$/, { message: 'First name can only contain letters, spaces, hyphens, apostrophes, and periods' }),

    lastName: z
        .string()
        .min(1, { message: 'Last name is required' })
        .max(50, { message: 'Last name must be less than 50 characters' })
        .regex(/^[a-zA-Z\s\-'\.]+$/, { message: 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods' }),

    email: z.email({ error: 'Please provide a valid email address' }).transform((val) => val.toLowerCase()),

    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(100, { message: 'Password must be less than 100 characters' })
        .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
        .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter' })
        .refine((val) => /\d/.test(val), { message: 'Password must contain at least one number' })
        .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), { message: 'Password must contain at least one special character' }),

    confirmPassword: z
        .string()
        .min(8, { message: 'Confirm password must be at least 8 characters long' })
        .max(100, { message: 'Confirm password must be less than 100 characters' })
        .refine((val) => /[A-Z]/.test(val), { message: 'Confirm password must contain at least one uppercase letter' })
        .refine((val) => /[a-z]/.test(val), { message: 'Confirm password must contain at least one lowercase letter' })
        .refine((val) => /\d/.test(val), { message: 'Confirm password must contain at least one number' })
        .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), { message: 'Confirm password must contain at least one special character' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Type inference for TypeScript
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;