import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './create-customer.handler';
import { customerRepository } from '../repositories/customer.repository';

jest.mock('../repositories/customer.repository');

describe('create-customer handler', () => {
  const mockCustomer = {
    customerId: 'test-id',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a customer successfully', async () => {
    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })
    } as APIGatewayProxyEvent;

    (customerRepository.getByEmail as jest.Mock).mockResolvedValue(null);
    (customerRepository.create as jest.Mock).mockResolvedValue(mockCustomer);

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual({
      data: mockCustomer
    });
  });

  it('should return 400 if body is missing', async () => {
    const event = {} as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Request body is required'
    });
  });

  it('should return 400 if validation fails', async () => {
    const event = {
      body: JSON.stringify({
        email: 'invalid-email',
        firstName: 'John'
        // lastName is missing
      })
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Validation failed');
  });

  it('should return 409 if customer with email already exists', async () => {
    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })
    } as APIGatewayProxyEvent;

    (customerRepository.getByEmail as jest.Mock).mockResolvedValue(mockCustomer);

    const result = await handler(event);

    expect(result.statusCode).toBe(409);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Customer with this email already exists'
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })
    } as APIGatewayProxyEvent;

    (customerRepository.getByEmail as jest.Mock).mockResolvedValue(null);
    (customerRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Internal server error'
    });
  });
});
