import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  UpdateLoyaltyPointsSchema,
  LoyaltyProgramSchema
} from './customer.model';

describe('Customer Model Schemas', () => {
  describe('CreateCustomerSchema', () => {
    it('should validate a complete customer', () => {
      const validCustomer = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        loyaltyProgram: {
          memberId: 'LOYAL123',
          tierLevel: 'GOLD',
          totalPoints: 1000,
          availablePoints: 500,
          tierExpiryDate: '2025-12-31T23:59:59Z'
        },
        preferences: {
          seatPreference: 'Window',
          mealPreference: 'Vegetarian'
        }
      };

      const result = CreateCustomerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should validate a minimal customer', () => {
      const minimalCustomer = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = CreateCustomerSchema.safeParse(minimalCustomer);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidCustomer = {
        email: 'not-an-email',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = CreateCustomerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const incompleteCustomer = {
        email: 'test@example.com',
        firstName: 'John'
        // lastName is missing
      };

      const result = CreateCustomerSchema.safeParse(incompleteCustomer);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCustomerSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        firstName: 'Jane'
      };

      const result = UpdateCustomerSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow updating loyalty program', () => {
      const loyaltyUpdate = {
        loyaltyProgram: {
          memberId: 'LOYAL456',
          tierLevel: 'PLATINUM',
          totalPoints: 5000,
          availablePoints: 2500
        }
      };

      const result = UpdateCustomerSchema.safeParse(loyaltyUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in update', () => {
      const invalidUpdate = {
        email: 'not-an-email'
      };

      const result = UpdateCustomerSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('LoyaltyProgramSchema', () => {
    it('should validate valid loyalty program', () => {
      const validProgram = {
        memberId: 'LOYAL123',
        tierLevel: 'SILVER',
        totalPoints: 500,
        availablePoints: 250
      };

      const result = LoyaltyProgramSchema.safeParse(validProgram);
      expect(result.success).toBe(true);
    });

    it('should reject invalid tier level', () => {
      const invalidProgram = {
        memberId: 'LOYAL123',
        tierLevel: 'DIAMOND', // Not a valid tier
        totalPoints: 500,
        availablePoints: 250
      };

      const result = LoyaltyProgramSchema.safeParse(invalidProgram);
      expect(result.success).toBe(false);
    });

    it('should reject negative points', () => {
      const invalidProgram = {
        memberId: 'LOYAL123',
        tierLevel: 'GOLD',
        totalPoints: -100,
        availablePoints: 250
      };

      const result = LoyaltyProgramSchema.safeParse(invalidProgram);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateLoyaltyPointsSchema', () => {
    it('should validate positive points change', () => {
      const validUpdate = {
        pointsChange: 100,
        reason: 'Flight purchase'
      };

      const result = UpdateLoyaltyPointsSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate negative points change', () => {
      const validUpdate = {
        pointsChange: -50,
        reason: 'Points redemption'
      };

      const result = UpdateLoyaltyPointsSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow update without reason', () => {
      const validUpdate = {
        pointsChange: 100
      };

      const result = UpdateLoyaltyPointsSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject non-integer points', () => {
      const invalidUpdate = {
        pointsChange: 100.5
      };

      const result = UpdateLoyaltyPointsSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });
});
