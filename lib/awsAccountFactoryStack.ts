import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ManagementAccount } from './constructs/managementAccount'
import { AccountFactory } from './constructs/accountFactory'
import { OrganizationUnits } from './constructs/organizationUnits'

type AwsAccountFactoryStackProps = {
  organizationId: string
  email: string
  rootOu: string
} & cdk.StackProps

export class AwsAccountFactoryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsAccountFactoryStackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here
    const managementAccount = new ManagementAccount(this, 'ManagementAccount', {
      budgetEmail: props.email,
      budgetName: 'ManagementBudget',
      organizationId: props.organizationId
    })

    const accountFactory = new AccountFactory(scope, 'AccountFactory', {})
    const organizationUnits = new OrganizationUnits(this, 'OrganizationUnits', {
      rootOrganizationId: props.rootOu
    })
  }
}
