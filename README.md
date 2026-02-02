# Chairlift Customers Microservice

Backend microservice for managing customers in the Chairlift application. Built with AWS Lambda, DynamoDB, and API Gateway.

## Architecture

- **Runtime**: Node.js 20 with TypeScript
- **Database**: Amazon DynamoDB
- **API**: AWS Lambda + API Gateway (REST)
- **Infrastructure**: AWS CDK
- **CI/CD**: GitHub Actions with OIDC authentication

## Features

- CRUD operations for customer profiles
- Email-based customer lookup
- Loyalty program management
- Points tracking and updates
- Customer preferences management
- Input validation with Zod
- Structured logging with Winston
- Comprehensive test coverage
- Production-ready infrastructure code

## API Endpoints

### Create Customer
```
POST /customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "nationality": "US",
  "loyaltyProgram": {
    "memberId": "LOYAL123",
    "tierLevel": "SILVER" | "GOLD" | "PLATINUM",
    "totalPoints": 1000,
    "availablePoints": 500,
    "tierExpiryDate": "2025-12-31T23:59:59Z"
  },
  "preferences": {
    "seatPreference": "Window",
    "mealPreference": "Vegetarian"
  }
}

Response: 201 Created
{
  "data": {
    "customerId": "uuid",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "nationality": "US",
    "loyaltyProgram": { ... },
    "preferences": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Customer by ID
```
GET /customers/{id}

Response: 200 OK / 404 Not Found
{
  "data": {
    "customerId": "uuid",
    "email": "customer@example.com",
    ...
  }
}
```

### Get Customer by Email
```
GET /customers/email/{email}

Response: 200 OK / 404 Not Found
{
  "data": {
    "customerId": "uuid",
    "email": "customer@example.com",
    ...
  }
}
```

### Update Customer
```
PUT /customers/{id}
Content-Type: application/json

{
  "firstName": "Jane",
  "phoneNumber": "+0987654321",
  "preferences": {
    "seatPreference": "Aisle"
  }
}

Response: 200 OK / 404 Not Found
{
  "data": {
    "customerId": "uuid",
    "firstName": "Jane",
    ...
  }
}
```

### Update Loyalty Points
```
PUT /customers/{id}/loyalty/points
Content-Type: application/json

{
  "pointsChange": 100,
  "reason": "Flight purchase"
}

Response: 200 OK / 404 Not Found
{
  "data": {
    "customerId": "uuid",
    "loyaltyProgram": {
      "totalPoints": 1100,
      "availablePoints": 600,
      ...
    },
    ...
  }
}
```

### Delete Customer
```
DELETE /customers/{id}

Response: 200 OK / 404 Not Found
{
  "data": {
    "message": "Customer deleted successfully"
  }
}
```

## Local Development

### Prerequisites

- Node.js 20+
- npm or yarn
- AWS CLI configured (for deployment)
- AWS CDK CLI (`npm install -g aws-cdk`)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

3. Lint code:
```bash
npm run lint
npm run lint:fix
```

4. Build:
```bash
npm run build
```

### Testing with DynamoDB Local

For integration testing with DynamoDB Local:

```bash
# Install DynamoDB Local
docker pull amazon/dynamodb-local

# Run DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Set environment variable
export AWS_ENDPOINT_URL=http://localhost:8000
export TABLE_NAME=chairlift-customers-local

# Run tests
npm test
```

## Deployment

### Prerequisites

1. AWS OIDC setup completed (see main project README)
2. GitHub repository secrets configured:
   - `AWS_ROLE_ARN`
   - `AWS_REGION`
   - `AWS_ACCOUNT_ID`

### Manual Deployment

```bash
# Build the project
npm run build

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy
cdk deploy

# View outputs
aws cloudformation describe-stacks \
  --stack-name ChairliftCustomersServiceStack \
  --query 'Stacks[0].Outputs'
```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- **CI Pipeline** (`.github/workflows/ci.yml`): Runs on PRs and pushes to main
  - Linting
  - Type checking
  - Tests
  - Build verification

- **CD Pipeline** (`.github/workflows/cd.yml`): Runs on pushes to main
  - Builds the application
  - Deploys to AWS using CDK
  - Outputs API URL

## DynamoDB Table Design

**Table Name**: `chairlift-customers`

**Primary Key**:
- PK (Partition Key): `CUSTOMER#{customerId}`
- SK (Sort Key): `PROFILE`

**GSI1** (Email lookup):
- GSI1PK (Partition Key): `EMAIL#{email}`
- GSI1SK (Sort Key): `CUSTOMER#{customerId}`

**GSI2** (Loyalty tier and points):
- GSI2PK (Partition Key): `TIER#{tierLevel}`
- GSI2SK (Sort Key): `POINTS#{totalPoints}` (zero-padded to 10 digits)

**Attributes**:
- customerId: UUID
- email: string (email format)
- firstName: string (1-100 chars)
- lastName: string (1-100 chars)
- phoneNumber: string (optional)
- dateOfBirth: ISO 8601 date string (optional)
- nationality: string (optional)
- loyaltyProgram: object (optional)
  - memberId: string
  - tierLevel: enum (SILVER, GOLD, PLATINUM)
  - totalPoints: number
  - availablePoints: number
  - tierExpiryDate: ISO 8601 timestamp (optional)
- preferences: object (optional)
  - seatPreference: string
  - mealPreference: string
- createdAt: ISO 8601 timestamp
- updatedAt: ISO 8601 timestamp

## Project Structure

```
chairlift-be-customers/
├── src/
│   ├── handlers/                     # Lambda function handlers
│   │   ├── create-customer.handler.ts
│   │   ├── get-customer.handler.ts
│   │   ├── get-customer-by-email.handler.ts
│   │   ├── update-customer.handler.ts
│   │   ├── update-loyalty-points.handler.ts
│   │   └── delete-customer.handler.ts
│   ├── repositories/                 # Data access layer
│   │   └── customer.repository.ts
│   ├── models/                       # Data models and schemas
│   │   ├── customer.model.ts
│   │   └── customer.model.test.ts
│   └── utils/                        # Utilities
│       ├── logger.ts
│       └── response.ts
├── infrastructure/                   # AWS CDK code
│   ├── bin/
│   │   └── app.ts
│   └── lib/
│       └── customers-service-stack.ts
├── .github/
│   └── workflows/                   # CI/CD pipelines
│       ├── ci.yml
│       └── cd.yml
├── package.json
├── tsconfig.json
├── jest.config.js
└── cdk.json
```

## Environment Variables

- `TABLE_NAME`: DynamoDB table name (default: `chairlift-customers`)
- `LOG_LEVEL`: Logging level (default: `info`)
- `AWS_REGION`: AWS region (default: `us-west-2`)

## Loyalty Program

The service supports a three-tier loyalty program:

- **SILVER**: Entry level
- **GOLD**: Mid-tier
- **PLATINUM**: Premium tier

Points management:
- `totalPoints`: Lifetime accumulated points
- `availablePoints`: Points available for redemption
- Points can be added or deducted via the update loyalty points endpoint
- Points cannot go negative

## License

MIT
