import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { customerRepository } from '../repositories/customer.repository';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const email = event.pathParameters?.email;

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    // Decode email if it's URL encoded
    const decodedEmail = decodeURIComponent(email);

    const customer = await customerRepository.getByEmail(decodedEmail);

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    logger.error('Error in get-customer-by-email handler', { error });
    return errorResponse('Internal server error', 500);
  }
};
