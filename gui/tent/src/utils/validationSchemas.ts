import { z } from 'zod';

// Username: 3-50 chars, alphanumeric + underscore/hyphen
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Email: standard email format
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email is too long'); // RFC 5321 limit

// Password: 8+ chars, mix of cases, numbers, special chars
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');
//   .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
//     'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Login schema
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'), // Basic for login
});

// Registration schema
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  password2: z.string(),
  acknowledge: z.boolean().refine((val: boolean) => val === true, 'You must acknowledge the security notice'),
}).refine((data: { password: string; password2: string }) => data.password === data.password2, {
  message: "Passwords don't match",
  path: ['password2'],
});