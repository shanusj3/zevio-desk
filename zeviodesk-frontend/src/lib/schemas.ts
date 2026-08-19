import { z } from 'zod';

// Login Validation Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Tenant / Shop Validation Schema
export const tenantSchema = z.object({
  name: z
    .string()
    .min(2, 'Tenant or Shop name must be at least 2 characters')
    .max(50, 'Tenant or Shop name cannot exceed 50 characters'),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
  subdomain: z
    .string()
    .min(2, 'Subdomain is required')
    .max(30, 'Subdomain cannot exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  businessEmail: z
    .string()
    .min(1, 'Business email is required')
    .max(100, 'Business email cannot exceed 100 characters')
    .email('Invalid business email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+\d+\s\d{10}$/, 'Phone number must be exactly 10 digits'),
  gstNumber: z
    .string()
    .max(15, 'GST number cannot exceed 15 characters')
    .optional(),
  address: z
    .string()
    .max(500, 'Address cannot exceed 500 characters')
    .optional(),
  primaryColor: z.string().min(1, 'Primary color is required'),
  secondaryColor: z.string().optional(),
  adminName: z
    .string()
    .min(2, 'Admin full name is required')
    .max(50, 'Admin full name cannot exceed 50 characters'),
  adminEmail: z
    .string()
    .min(1, 'Admin email is required')
    .max(100, 'Admin email cannot exceed 100 characters')
    .email('Invalid admin email address'),
  adminPhone: z
    .string()
    .min(1, 'Admin phone number is required')
    .regex(/^\+\d+\s\d{10}$/, 'Admin phone number must be exactly 10 digits'),
  status: z.enum(['Active', 'Inactive']),
  usersCount: z.number().min(1, 'Users count must be at least 1'),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// WhatsApp Integration Validation Schema
export const whatsAppSchema = z.object({
  wabaAccountId: z
    .string()
    .min(5, 'WhatsApp Business Account ID must be at least 5 digits')
    .regex(/^\d+$/, 'Account ID must contain numbers only'),
  phoneNumberId: z
    .string()
    .min(5, 'Phone Number ID must be at least 5 digits')
    .regex(/^\d+$/, 'Phone Number ID must contain numbers only'),
  accessToken: z
    .string()
    .min(10, 'Permanent access token must be at least 10 characters'),
});

export type WhatsAppFormData = z.infer<typeof whatsAppSchema>;
