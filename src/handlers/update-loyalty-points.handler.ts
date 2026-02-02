import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateLoyaltyPointsSchema } from '../models/customer.model';
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
    const validationResult = UpdateLoyaltyPointsSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        `Validation failed: ${validationResult.error.message}`,
        400
      );
    }

    const customer = await customerRepository.updateLoyaltyPoints(customerId, validationResult.data);

    if (!customer) {
      return errorResponse('Customer not found or does not have a loyalty program', 404);
    }

    return successResponse(customer);
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient loyalty points') {
      return errorResponse('Insufficient loyalty points', 400);
    }
    logger.error('Error in update-loyalty-points handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
