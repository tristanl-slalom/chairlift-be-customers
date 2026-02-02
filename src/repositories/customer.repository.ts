import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  Customer,
  DynamoDBCustomer,
  CreateCustomerInput,
  UpdateCustomerInput,
  UpdateLoyaltyPointsInput
} from '../models/customer.model';
import logger from '../utils/logger';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'chairlift-customers';

export class CustomerRepository {
  private tableName: string;

  constructor(tableName: string = TABLE_NAME) {
    this.tableName = tableName;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const customerId = uuidv4();
    const now = new Date().toISOString();

    const customer: DynamoDBCustomer = {
      PK: `CUSTOMER#${customerId}`,
      SK: 'PROFILE',
      GSI1PK: `EMAIL#${input.email}`,
      GSI1SK: `CUSTOMER#${customerId}`,
      customerId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      dateOfBirth: input.dateOfBirth,
      nationality: input.nationality,
      loyaltyProgram: input.loyaltyProgram,
      preferences: input.preferences,
      createdAt: now,
      updatedAt: now
    };

    // Add GSI2 keys if loyalty program exists
    if (input.loyaltyProgram) {
      customer.GSI2PK = `TIER#${input.loyaltyProgram.tierLevel}`;
      customer.GSI2SK = `POINTS#${String(input.loyaltyProgram.totalPoints).padStart(10, '0')}`;
    }

    try {
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: customer,
        ConditionExpression: 'attribute_not_exists(PK)'
      }));

      logger.info('Customer created', { customerId });
      return this.toCustomer(customer);
    } catch (error) {
      logger.error('Error creating customer', { error });
      throw error;
    }
  }

  async getById(customerId: string): Promise<Customer | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CUSTOMER#${customerId}`,
          SK: 'PROFILE'
        }
      }));

      if (!result.Item) {
        return null;
      }

      return this.toCustomer(result.Item as DynamoDBCustomer);
    } catch (error) {
      logger.error('Error getting customer', { customerId, error });
      throw error;
    }
  }

  async getByEmail(email: string): Promise<Customer | null> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `EMAIL#${email}`
        },
        Limit: 1
      }));

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return this.toCustomer(result.Items[0] as DynamoDBCustomer);
    } catch (error) {
      logger.error('Error getting customer by email', { email, error });
      throw error;
    }
  }

  async update(customerId: string, input: UpdateCustomerInput): Promise<Customer | null> {
    const existing = await this.getById(customerId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#updatedAt': 'updatedAt'
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': now
    };

    if (input.email !== undefined) {
      updateExpressions.push('#email = :email');
      updateExpressions.push('#GSI1PK = :GSI1PK');
      expressionAttributeNames['#email'] = 'email';
      expressionAttributeNames['#GSI1PK'] = 'GSI1PK';
      expressionAttributeValues[':email'] = input.email;
      expressionAttributeValues[':GSI1PK'] = `EMAIL#${input.email}`;
    }

    if (input.firstName !== undefined) {
      updateExpressions.push('#firstName = :firstName');
      expressionAttributeNames['#firstName'] = 'firstName';
      expressionAttributeValues[':firstName'] = input.firstName;
    }

    if (input.lastName !== undefined) {
      updateExpressions.push('#lastName = :lastName');
      expressionAttributeNames['#lastName'] = 'lastName';
      expressionAttributeValues[':lastName'] = input.lastName;
    }

    if (input.phoneNumber !== undefined) {
      updateExpressions.push('#phoneNumber = :phoneNumber');
      expressionAttributeNames['#phoneNumber'] = 'phoneNumber';
      expressionAttributeValues[':phoneNumber'] = input.phoneNumber;
    }

    if (input.dateOfBirth !== undefined) {
      updateExpressions.push('#dateOfBirth = :dateOfBirth');
      expressionAttributeNames['#dateOfBirth'] = 'dateOfBirth';
      expressionAttributeValues[':dateOfBirth'] = input.dateOfBirth;
    }

    if (input.nationality !== undefined) {
      updateExpressions.push('#nationality = :nationality');
      expressionAttributeNames['#nationality'] = 'nationality';
      expressionAttributeValues[':nationality'] = input.nationality;
    }

    if (input.loyaltyProgram !== undefined) {
      updateExpressions.push('#loyaltyProgram = :loyaltyProgram');
      updateExpressions.push('#GSI2PK = :GSI2PK');
      updateExpressions.push('#GSI2SK = :GSI2SK');
      expressionAttributeNames['#loyaltyProgram'] = 'loyaltyProgram';
      expressionAttributeNames['#GSI2PK'] = 'GSI2PK';
      expressionAttributeNames['#GSI2SK'] = 'GSI2SK';
      expressionAttributeValues[':loyaltyProgram'] = input.loyaltyProgram;
      expressionAttributeValues[':GSI2PK'] = `TIER#${input.loyaltyProgram.tierLevel}`;
      expressionAttributeValues[':GSI2SK'] = `POINTS#${String(input.loyaltyProgram.totalPoints).padStart(10, '0')}`;
    }

    if (input.preferences !== undefined) {
      updateExpressions.push('#preferences = :preferences');
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeValues[':preferences'] = input.preferences;
    }

    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `CUSTOMER#${customerId}`,
          SK: 'PROFILE'
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));

      logger.info('Customer updated', { customerId });
      return this.toCustomer(result.Attributes as DynamoDBCustomer);
    } catch (error) {
      logger.error('Error updating customer', { customerId, error });
      throw error;
    }
  }

  async updateLoyaltyPoints(customerId: string, input: UpdateLoyaltyPointsInput): Promise<Customer | null> {
    const existing = await this.getById(customerId);
    if (!existing || !existing.loyaltyProgram) {
      return null;
    }

    const now = new Date().toISOString();
    const newTotalPoints = existing.loyaltyProgram.totalPoints + input.pointsChange;
    const newAvailablePoints = existing.loyaltyProgram.availablePoints + input.pointsChange;

    // Validate points don't go negative
    if (newTotalPoints < 0 || newAvailablePoints < 0) {
      throw new Error('Insufficient loyalty points');
    }

    const updatedLoyaltyProgram = {
      ...existing.loyaltyProgram,
      totalPoints: newTotalPoints,
      availablePoints: newAvailablePoints
    };

    try {
      const result = await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `CUSTOMER#${customerId}`,
          SK: 'PROFILE'
        },
        UpdateExpression: 'SET #loyaltyProgram = :loyaltyProgram, #GSI2SK = :GSI2SK, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#loyaltyProgram': 'loyaltyProgram',
          '#GSI2SK': 'GSI2SK',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':loyaltyProgram': updatedLoyaltyProgram,
          ':GSI2SK': `POINTS#${String(newTotalPoints).padStart(10, '0')}`,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      }));

      logger.info('Customer loyalty points updated', {
        customerId,
        pointsChange: input.pointsChange,
        newTotal: newTotalPoints,
        reason: input.reason
      });
      return this.toCustomer(result.Attributes as DynamoDBCustomer);
    } catch (error) {
      logger.error('Error updating loyalty points', { customerId, error });
      throw error;
    }
  }

  async delete(customerId: string): Promise<boolean> {
    try {
      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `CUSTOMER#${customerId}`,
          SK: 'PROFILE'
        }
      }));

      logger.info('Customer deleted', { customerId });
      return true;
    } catch (error) {
      logger.error('Error deleting customer', { customerId, error });
      throw error;
    }
  }

  private toCustomer(dynamoDBCustomer: DynamoDBCustomer): Customer {
    return {
      customerId: dynamoDBCustomer.customerId,
      email: dynamoDBCustomer.email,
      firstName: dynamoDBCustomer.firstName,
      lastName: dynamoDBCustomer.lastName,
      phoneNumber: dynamoDBCustomer.phoneNumber,
      dateOfBirth: dynamoDBCustomer.dateOfBirth,
      nationality: dynamoDBCustomer.nationality,
      loyaltyProgram: dynamoDBCustomer.loyaltyProgram,
      preferences: dynamoDBCustomer.preferences,
      createdAt: dynamoDBCustomer.createdAt,
      updatedAt: dynamoDBCustomer.updatedAt
    };
  }
}

export const customerRepository = new CustomerRepository();
