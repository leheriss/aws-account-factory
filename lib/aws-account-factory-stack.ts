import * as cdk from '@aws-cdk/core'
import { ManagementAccount } from './constructs/management-account'

type AwsAccountFactoryStackProps = {
  organizationId: string
  email: string
} & cdk.StackProps

export class AwsAccountFactoryStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AwsAccountFactoryStackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here
    const managementAccount= new ManagementAccount(this, 'ManagementAccount', {
      budgetEmail: props.email,
      budgetName: 'ManagementBudget',
      organizationId: props.organizationId
    })
  }
}
