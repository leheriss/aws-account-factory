import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import {
	aws_lambda_nodejs as lambdajs,
	aws_lambda as lambda,
	aws_iam as iam,
	aws_stepfunctions as sf,
	aws_stepfunctions_tasks as tasks,
	aws_cloudwatch as cw,
	Duration,
	Stack
} from 'aws-cdk-lib'
import { buildFunctionAlarm } from '../utils'

interface AccountFactoryProps {
	sandboxOU: string
	rootOU: string
	email: string
	jumpAccountId: string
	mgmtAccountId: string
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
				EMAIL: props.email
			}
		})

		createAccountFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: [
				'organizations:CreateAccount', 
				'organizations:MoveAccount', 
				'organizations:DescribeCreateAccountStatus'
			],
			effect: iam.Effect.ALLOW,
			resources: ['*']
		}))

		createAccountFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['account:PutAlternateContact'],
			effect: iam.Effect.ALLOW,
			resources: ['*']
		}))

		const createUserFunction = new lambdajs.NodejsFunction(this, 'createUserFunction', {
			entry: './lambdas/createUser.ts',
			handler: 'handler',
			functionName: 'createUser',
			runtime: lambda.Runtime.NODEJS_14_X,
			timeout: cdk.Duration.seconds(900),
			architecture: lambda.Architecture.ARM_64,
			memorySize: 1024,
			environment: {
				REGION: region,
				JUMP_ACCOUNT_ID: props.jumpAccountId,
				MGMT_ACCOUNT_ID: props.mgmtAccountId
			}
		})

		createUserFunction.addToRolePolicy(new iam.PolicyStatement({
			actions: ['iam:CreateUser', 'iam:CreateLoginProfile', 'iam:AttachUserPolicy', 'iam:PutUserPolicy', 'iam:AddUserToGroup'],
			effect: iam.Effect.ALLOW,
			resources: ['*']
		}))


		if (props.jumpAccountId !== props.mgmtAccountId) {
			createUserFunction.addToRolePolicy(new iam.PolicyStatement({
				actions: ['sts:AssumeRole'],
				effect: iam.Effect.ALLOW,
				resources: [`arn:aws:iam::${props.jumpAccountId}:role/role-jump`]
			})) 
		}

		//alarms for lambdas

		buildFunctionAlarm(this, 'CreateAccountAlarm', createAccountFunction)
		buildFunctionAlarm(this, 'CreateUserAlarm', createUserFunction)

		// Step function

		const createAccountJob = new tasks.LambdaInvoke(this, 'createAccountJob', {
			lambdaFunction: createAccountFunction,
			payload: sf.TaskInput.fromObject({ email: sf.JsonPath.stringAt('$.email')}),
			outputPath: '$.Payload'
		})

		const createUserJob = new tasks.LambdaInvoke(this, 'createUserJob', {
			lambdaFunction: createUserFunction,
			payload: sf.TaskInput.fromObject({ email: sf.JsonPath.stringAt('$.email'), accountId: sf.JsonPath.stringAt('$.accountId') }),
			resultPath: '$'
		})

		new sf.StateMachine(this, 'CreateAccountStateMachine', {
			definition: createAccountJob.next(createUserJob),
			timeout: Duration.seconds(5000),
			stateMachineName: 'CreateAccountStateMachine'
		})
	}
}