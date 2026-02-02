import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class CustomersServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'CustomersTable', {
      tableName: 'chairlift-customers',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    // GSI1 for email lookup
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // GSI2 for loyalty tier and points lookup
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Lambda function configuration
    const lambdaEnvironment = {
      TABLE_NAME: table.tableName,
      LOG_LEVEL: 'info'
    };

    const lambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK
    };

    // Lambda Functions
    const createCustomerFn = new lambda.Function(this, 'CreateCustomerFunction', {
      ...lambdaProps,
      functionName: 'chairlift-create-customer',
      handler: 'handlers/create-customer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const getCustomerFn = new lambda.Function(this, 'GetCustomerFunction', {
      ...lambdaProps,
      functionName: 'chairlift-get-customer',
      handler: 'handlers/get-customer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const getCustomerByEmailFn = new lambda.Function(this, 'GetCustomerByEmailFunction', {
      ...lambdaProps,
      functionName: 'chairlift-get-customer-by-email',
      handler: 'handlers/get-customer-by-email.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const updateCustomerFn = new lambda.Function(this, 'UpdateCustomerFunction', {
      ...lambdaProps,
      functionName: 'chairlift-update-customer',
      handler: 'handlers/update-customer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const updateLoyaltyPointsFn = new lambda.Function(this, 'UpdateLoyaltyPointsFunction', {
      ...lambdaProps,
      functionName: 'chairlift-update-loyalty-points',
      handler: 'handlers/update-loyalty-points.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    const deleteCustomerFn = new lambda.Function(this, 'DeleteCustomerFunction', {
      ...lambdaProps,
      functionName: 'chairlift-delete-customer',
      handler: 'handlers/delete-customer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-dist'))
    });

    // Grant DynamoDB permissions
    table.grantReadWriteData(createCustomerFn);
    table.grantReadData(getCustomerFn);
    table.grantReadData(getCustomerByEmailFn);
    table.grantReadWriteData(updateCustomerFn);
    table.grantReadWriteData(updateLoyaltyPointsFn);
    table.grantReadWriteData(deleteCustomerFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'CustomersApi', {
      restApiName: 'Chairlift Customers API',
      description: 'API for managing customers in Chairlift application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ]
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      }
    });

    // API Resources
    const customers = api.root.addResource('customers');
    const customer = customers.addResource('{id}');
    const customerLoyalty = customer.addResource('loyalty');
    const customerLoyaltyPoints = customerLoyalty.addResource('points');

    const email = customers.addResource('email');
    const emailAddress = email.addResource('{email}');

    // Customer API Methods
    customers.addMethod('POST', new apigateway.LambdaIntegration(createCustomerFn));
    customer.addMethod('GET', new apigateway.LambdaIntegration(getCustomerFn));
    customer.addMethod('PUT', new apigateway.LambdaIntegration(updateCustomerFn));
    customer.addMethod('DELETE', new apigateway.LambdaIntegration(deleteCustomerFn));

    // Email lookup endpoint
    emailAddress.addMethod('GET', new apigateway.LambdaIntegration(getCustomerByEmailFn));

    // Loyalty points endpoint
    customerLoyaltyPoints.addMethod('PUT', new apigateway.LambdaIntegration(updateLoyaltyPointsFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'ChairliftCustomersApiUrl'
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
      exportName: 'ChairliftCustomersTableName'
    });
  }
}
