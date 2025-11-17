import type { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Create a DOMPurify instance for server-side HTML sanitization
const window = new JSDOM('').window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitization options for different field types
 */
interface SanitizationOptions {
  trim?: boolean;
  escape?: boolean;
  stripHtml?: boolean;
  normalizeEmail?: boolean;
  removeSpecialChars?: boolean;
  maxLength?: number;
}

/**
 * Default sanitization options for different field types
 */
const DEFAULT_OPTIONS: Record<string, SanitizationOptions> = {
  // Text fields - basic sanitization
  text: {
    trim: true,
    escape: true,
    stripHtml: true,
    maxLength: 1000,
  },

  // Name fields - more restrictive
  name: {
    trim: true,
    escape: true,
    stripHtml: true,
    removeSpecialChars: true,
    maxLength: 50,
  },

  // Email fields - normalize and escape
  email: {
    trim: true,
    normalizeEmail: true,
    escape: true,
    maxLength: 254,
  },

  // Password fields - minimal sanitization (don't escape special chars)
  password: {
    trim: true,
    maxLength: 100,
  },

  // Description/textarea fields - allow some HTML but sanitize
  description: {
    trim: true,
    stripHtml: true,
    escape: true,
    maxLength: 5000,
  },
};

/**
 * Sanitize a string value based on the provided options
 */
function sanitizeString(value: string, options: SanitizationOptions): string {
  if (typeof value !== 'string') {
    return value;
  }

  let sanitized = value;

  // Trim whitespace
  if (options.trim) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags and content
  if (options.stripHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  // Escape HTML entities
  if (options.escape) {
    sanitized = validator.escape(sanitized);
  }

  // Remove special characters (keep only alphanumeric, spaces, and basic punctuation)
  if (options.removeSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-'.]/g, '');
  }

  // Normalize email
  if (options.normalizeEmail) {
    sanitized = validator.normalizeEmail(sanitized) || sanitized;
  }

  // Truncate if too long
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Recursively sanitize an object's string properties
 */
function sanitizeObject(
  obj: unknown,
  fieldConfig: Record<string, string>
): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj; // Will be handled by the field-specific sanitization
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, fieldConfig));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fieldType = fieldConfig[key] || 'text';
      const options = DEFAULT_OPTIONS[fieldType] ?? DEFAULT_OPTIONS.text;

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(
          value,
          options ?? (DEFAULT_OPTIONS.text as SanitizationOptions)
        );
      } else {
        sanitized[key] = sanitizeObject(value, fieldConfig);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Create a sanitization middleware for specific field configurations
 */
export const createSanitizationMiddleware = (
  fieldConfig: Record<string, string>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, fieldConfig);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, fieldConfig) as typeof req.query;
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(
          req.params,
          fieldConfig
        ) as typeof req.params;
      }

      next();
    } catch (error) {
      console.error('Sanitization error:', error);
      res.status(400).json({
        error: 'Invalid input data',
        message: 'The provided data contains invalid characters or format',
      });
    }
  };
};

/**
 * Predefined sanitization middleware for common use cases
 */

// User registration/authentication sanitization
export const sanitizeUserInput = createSanitizationMiddleware({
  firstName: 'name',
  lastName: 'name',
  email: 'email',
  password: 'password',
  confirmPassword: 'password',
});

// General text input sanitization
export const sanitizeTextInput = createSanitizationMiddleware({
  title: 'text',
  description: 'description',
  content: 'description',
  message: 'text',
  comment: 'text',
});

// Search/filter input sanitization
export const sanitizeSearchInput = createSanitizationMiddleware({
  query: 'text',
  search: 'text',
  filter: 'text',
  sort: 'text',
});

/**
 * Utility function to sanitize a single value
 */
export const sanitizeValue = (
  value: string,
  type: keyof typeof DEFAULT_OPTIONS = 'text'
): string => {
  const options = DEFAULT_OPTIONS[type] ?? DEFAULT_OPTIONS.text!;
  return sanitizeString(value, options);
};

/**
 * Utility function to check if a string contains potentially dangerous content
 */
export const containsDangerousContent = (value: string): boolean => {
  if (typeof value !== 'string') return false;

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /<style[^>]*>.*?<\/style>/gi,
  ];

  return dangerousPatterns.some(pattern => pattern.test(value));
};

export default {
  createSanitizationMiddleware,
  sanitizeUserInput,
  sanitizeTextInput,
  sanitizeSearchInput,
  sanitizeValue,
  containsDangerousContent,
};
