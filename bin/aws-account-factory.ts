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
if (!process.env.ROOT_OU) {
  throw new Error('No ROOT_OU provided in environment variables.')
}
if (!process.env.JUMP_ACCOUNT_ID){
  throw new Error('No JUMP_ACCOUNT_ID provided in environment variables.')
}

if (!process.env.MGMT_ACCOUNT_ID){
  throw new Error('No MGMT_ACCOUNT_ID provided in environment variables.')
}

new AwsAccountFactoryStack(app, 'AwsAccountFactoryStack', {
  organizationId: process.env.ORGANIZATION_ID,
  rootOu: process.env.ROOT_OU,
  email: process.env.EMAIL,
  jumpAccountId: process.env.JUMP_ACCOUNT_ID,
  mgmtAccountId: process.env.MGMT_ACCOUNT_ID
})
