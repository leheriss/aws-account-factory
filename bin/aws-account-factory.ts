#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import dotenv from 'dotenv'
import { AwsAccountFactoryStack } from '../lib/awsAccountFactoryStack'

dotenv.config()

const app = new cdk.App()

if (!process.env.ORGANIZATION_ID) {
  throw new Error('No ORGANIZATION_ID provided in environment variables.')
}
if (!process.env.EMAIL) {
  throw new Error('No EMAIL provided in environment variables.')
}

new AwsAccountFactoryStack(app, 'AwsAccountFactoryStack', {
  organizationId: process.env.ORGANIZATION_ID,
  email: process.env.EMAIL
})
