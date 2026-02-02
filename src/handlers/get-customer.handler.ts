import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { customerRepository } from '../repositories/customer.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const customerId = event.pathParameters?.id;

    if (!customerId) {
      return errorResponse('Customer ID is required', 400);
    }

    const customer = await customerRepository.getById(customerId);

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    logger.error('Error in get-customer handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
