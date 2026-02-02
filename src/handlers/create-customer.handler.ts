import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateCustomerSchema } from '../models/customer.model';
import { customerRepository } from '../repositories/customer.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);
    const validationResult = CreateCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.message}`,
        400
      );
    }

    // Check if customer with email already exists
    const existingCustomer = await customerRepository.getByEmail(validationResult.data.email);
    if (existingCustomer) {
      return errorResponse('Customer with this email already exists', 409);
    }

    const customer = await customerRepository.create(validationResult.data);
    return successResponse(customer, 201);
  } catch (error) {
    logger.error('Error in create-customer handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
