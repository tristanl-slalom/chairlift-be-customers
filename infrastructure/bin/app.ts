#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CustomersServiceStack } from '../lib/customers-service-stack';

const app = new cdk.App();

new CustomersServiceStack(app, 'ChairliftCustomersServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2'
  },
  description: 'Chairlift Customers Microservice Stack'
});
