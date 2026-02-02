import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateCustomerSchema } from '../models/customer.model';
import { customerRepository } from '../repositories/customer.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const customerId = event.pathParameters?.id;

    if (!customerId) {
      return errorResponse('Customer ID is required', 400);
    }

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);
    const validationResult = UpdateCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.message}`,
        400
      );
    }

    // If email is being updated, check it doesn't already exist for another customer
    if (validationResult.data.email) {
      const existingCustomer = await customerRepository.getByEmail(validationResult.data.email);
      if (existingCustomer && existingCustomer.customerId !== customerId) {
        return errorResponse('Customer with this email already exists', 409);
      }
    }

    const customer = await customerRepository.update(customerId, validationResult.data);

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    logger.error('Error in update-customer handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
