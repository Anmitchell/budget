import type { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';

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
    stripHtml: true, // Remove all HTML tags (XSS prevention)
    maxLength: 1000,
  },

  // Name fields - more restrictive
  name: {
    trim: true,
    stripHtml: true, // Remove all HTML tags (XSS prevention)
    removeSpecialChars: true, // Format validation - only allow valid name characters
    maxLength: 50,
  },

  // Email fields - normalize only (don't escape - breaks email format)
  email: {
    trim: true,
    normalizeEmail: true,
    maxLength: 254,
  },

  // Password fields - minimal sanitization
  // IMPORTANT: Do NOT trim passwords - spaces may be intentional!
  // Trimming passwords changes the password, which is a security risk
  password: {
    maxLength: 100,
  },

  // Description/textarea fields - remove HTML for security
  description: {
    trim: true,
    stripHtml: true, // Remove all HTML tags (XSS prevention)
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

  // Remove HTML tags and content (XSS prevention)
  // This is sufficient - no need to escape since we're removing all HTML
  if (options.stripHtml) {
    sanitized = sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
    });
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
 * @param obj - The object to sanitize
 * @param fieldConfig - Configuration mapping field names to sanitization types
 * @param strictMode - If true, only process fields in fieldConfig and remove unknown fields
 */
function sanitizeObject(
  obj: unknown,
  fieldConfig: Record<string, string>,
  strictMode: boolean = false
): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj; // Will be handled by the field-specific sanitization
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, fieldConfig, strictMode));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // In strict mode, skip fields not in the config
      if (strictMode && !(key in fieldConfig)) {
        continue; // Skip unknown fields
      }

      const fieldType = fieldConfig[key] || 'text';
      const options = DEFAULT_OPTIONS[fieldType] ?? DEFAULT_OPTIONS.text;

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(
          value,
          options ?? (DEFAULT_OPTIONS.text as SanitizationOptions)
        );
      } else {
        sanitized[key] = sanitizeObject(value, fieldConfig, strictMode);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Create a sanitization middleware for specific field configurations
 * @param fieldConfig - Configuration mapping field names to sanitization types
 * @param options - Additional options for the middleware
 * @param options.strictMode - If true, only process fields in fieldConfig and remove unknown fields (default: true for security)
 */
export const createSanitizationMiddleware = (
  fieldConfig: Record<string, string>,
  options: { strictMode?: boolean } = { strictMode: true }
) => {
  const strictMode = options.strictMode ?? true; // Default to strict mode for security

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, fieldConfig, strictMode);
      }

      // Sanitize query parameters (mutate properties since req.query is read-only)
      if (req.query && typeof req.query === 'object') {
        const sanitizedQuery = sanitizeObject(
          req.query,
          fieldConfig,
          strictMode
        ) as typeof req.query;
        // Mutate properties instead of replacing the object
        Object.keys(req.query).forEach(key => {
          delete (req.query as Record<string, unknown>)[key];
        });
        Object.assign(req.query, sanitizedQuery);
      }

      // Sanitize URL parameters
      if (req.params && typeof req.params === 'object') {
        const sanitizedParams = sanitizeObject(
          req.params,
          fieldConfig,
          strictMode
        ) as typeof req.params;
        // Mutate properties instead of replacing the object
        Object.keys(req.params).forEach(key => {
          delete (req.params as Record<string, unknown>)[key];
        });
        Object.assign(req.params, sanitizedParams);
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
