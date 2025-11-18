import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';

export const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      req.body = schema.parse(req.body);
      next();
    } catch (error: unknown) {
      // Handle Zod errors
      if (error instanceof ZodError) {
        // Format Zod errors for better client experience
        const formattedErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        // Return the formatted errors to the client
        res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
        });
        return; // Don't call next() - we're sending a response
      }

      // Handle other errors
      res.status(500).json({
        error: 'Internal server error',
      });
      return; // Don't call next() - we're sending a response
    }
  };
};
