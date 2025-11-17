import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Rate limiting for registration endpoint
export const registrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 registration attempts per windowMs
  message: {
    error: 'Too many registration attempts',
    message: 'Please try again in 15 minutes',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (only count failed attempts)
  skipSuccessfulRequests: true,
  // Custom key generator using ipKeyGenerator helper for proper IPv6 support
  keyGenerator: req => {
    return ipKeyGenerator(req.ip || 'unknown'); // Use IP address as the key, fallback to 'unknown'
  },
});

// General API rate limiting (for other endpoints)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again in 15 minutes',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
