import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import {
	aws_lambda_nodejs as lambdajs,
	aws_lambda as lambda,
	aws_iam as iam,
} from 'aws-cdk-lib'

interface AccountFactoryProps {
	sandboxOU: string
	rootOU: string
	email: string
}

export class AccountFactory extends Construct {
	constructor(scope: Construct, id: string, props: AccountFactoryProps) {
		super(scope, id)

		const region = Stack.of(this).region

		const createAccountFunction = new lambdajs.NodejsFunction(this, 'createAccountFunction', {
			entry: './lambdas/createAccount.ts',
			handler: 'handler',
			functionName: 'createAccount',
			runtime: lambda.Runtime.NODEJS_14_X,
			timeout: cdk.Duration.seconds(900),
			architecture: lambda.Architecture.ARM_64,
			memorySize: 1024,
			environment: {
				DESTINATION_OU: props.sandboxOU,
				ROOT_OU: props.rootOU,
				EMAIL: props.email,
				REGION: region
			}
		})

		createAccountFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['organizations:CreateAccount', 'organizations:MoveAccount', 'organizations:DescribeCreateAccountStatus'],
			effect: iam.Effect.ALLOW,
			resources: ['*']
		}))

		createAccountFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['account:PutAlternateContact'],
			effect: iam.Effect.ALLOW,
			resources: ['*']
		}))
	}
}