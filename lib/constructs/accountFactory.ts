import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import {
	aws_lambda_nodejs as lambdajs,
	aws_lambda as lambda,
	aws_iam as iam
} from 'aws-cdk-lib'

interface AccountFactoryProps {

}

export class AccountFactory extends Construct {
	constructor(scope: Construct, id: string, props: AccountFactoryProps) {
		super(scope, id)

		const createAccountFunction = new lambdajs.NodejsFunction(this, 'createAccountFunction', {
			entry: './lambdas/createAccount.ts',
			handler: 'handler',
			runtime: lambda.Runtime.NODEJS_14_X,
			timeout: cdk.Duration.seconds(900),
			architecture: lambda.Architecture.ARM_64,
			memorySize: 1024,
		})

		createAccountFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['organizations:CreateAccount'],
			effect: iam.Effect.ALLOW,
			resources: ['*']
		}))
	}
}