import { z } from 'zod';

// Loyalty tier levels
export const LoyaltyTier = {
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
} as const;

export type LoyaltyTier = typeof LoyaltyTier[keyof typeof LoyaltyTier];

// Loyalty program schema
export const LoyaltyProgramSchema = z.object({
  memberId: z.string().min(1),
  tierLevel: z.enum(['SILVER', 'GOLD', 'PLATINUM']),
  totalPoints: z.number().int().min(0),
  availablePoints: z.number().int().min(0),
  tierExpiryDate: z.string().datetime().optional()
});

// Customer preferences schema
export const CustomerPreferencesSchema = z.object({
  seatPreference: z.string().optional(),
  mealPreference: z.string().optional()
});

// Customer schema for creation
export const CreateCustomerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO 8601 date string
  nationality: z.string().optional(),
  loyaltyProgram: LoyaltyProgramSchema.optional(),
  preferences: CustomerPreferencesSchema.optional()
});

// Customer schema for updates
export const UpdateCustomerSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  loyaltyProgram: LoyaltyProgramSchema.optional(),
  preferences: CustomerPreferencesSchema.optional()
});

// Loyalty points update schema
export const UpdateLoyaltyPointsSchema = z.object({
  pointsChange: z.number().int(),
  reason: z.string().min(1).max(500).optional()
});

// Type inference
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type UpdateLoyaltyPointsInput = z.infer<typeof UpdateLoyaltyPointsSchema>;
export type LoyaltyProgram = z.infer<typeof LoyaltyProgramSchema>;
export type CustomerPreferences = z.infer<typeof CustomerPreferencesSchema>;

// Customer interface
export interface Customer {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  loyaltyProgram?: LoyaltyProgram;
  preferences?: CustomerPreferences;
  createdAt: string;
  updatedAt: string;
}

// DynamoDB customer interface
export interface DynamoDBCustomer {
  PK: string; // CUSTOMER#{customerId}
  SK: string; // PROFILE
  GSI1PK?: string; // EMAIL#{email}
  GSI1SK?: string; // CUSTOMER#{customerId}
  GSI2PK?: string; // TIER#{tierLevel}
  GSI2SK?: string; // POINTS#{totalPoints}
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  loyaltyProgram?: LoyaltyProgram;
  preferences?: CustomerPreferences;
  createdAt: string;
  updatedAt: string;
}
