import { Router } from 'express';
import userController from '../controllers/userController.js';
import { userRegistrationSchema } from '../validation/userValidation.js';
import { validateRequest } from '../middleware/validation.js';
import { registrationRateLimit } from '../middleware/rateLimiting.js';

const router = Router();

router.post(
  '/register',
  registrationRateLimit,
  validateRequest(userRegistrationSchema),
  userController.registerUser
);

export default router;
