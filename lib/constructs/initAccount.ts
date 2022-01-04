import { Construct } from 'constructs'
import { 
	aws_cloudformation as cloudformation, 
	Stack 
} from 'aws-cdk-lib'

interface InitAccountProps {
	sandboxOuId: string
	jumpAccountId: string
}

export class InitAccount extends Construct {
	constructor(scope: Construct, id: string, props: InitAccountProps) {
		super(scope, id)

		const region = Stack.of(this).region

		const initAccountTemplate = {
			AWSTemplateFormatVersion: "2010-09-09",
			Description: 'Template deploying all resources dedicated to Account initialization',
			Resources: {
				UserRole: {
					Type : 'AWS::IAM::Role',
					Properties : {
						AssumeRolePolicyDocument : {
							Version: '2012-10-17',
							Statement: [
									{
											Effect: 'Allow',
											Principal: {
													AWS: [
														props.jumpAccountId
													]
											},
											Action: [
													'sts:AssumeRole'
											]
									}
							]
						},
						Description : 'Role used by the user',
						ManagedPolicyArns : [ 'arn:aws:iam::aws:policy/AdministratorAccess' ],
						MaxSessionDuration : 3600,
						RoleName : 'role-user',
					}
				},
				OpsRole: {
					Type : 'AWS::IAM::Role',
					Properties : {
						AssumeRolePolicyDocument : {
							Version: '2012-10-17',
							Statement: [
									{
											Effect: 'Allow',
											Principal: {
													AWS: [
														props.jumpAccountId
													]
											},
											Action: [
													'sts:AssumeRole'
											]
									}
							]
						},
						Description : 'Role used by the administrator',
						ManagedPolicyArns : [ 'arn:aws:iam::aws:policy/AdministratorAccess' ],
						MaxSessionDuration : 3600,
						RoleName : 'role-ops',
					}
				}
			}
		}

		new cloudformation.CfnStackSet(this, 'InitAccountStackset', {
			permissionModel: 'SERVICE_MANAGED',
			stackSetName: 'initAccount',
			templateBody: JSON.stringify(initAccountTemplate),
			autoDeployment: {
				enabled: true,
				retainStacksOnAccountRemoval: false,
			},
			capabilities: [ 'CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
			managedExecution: { Active: true },
			operationPreferences: {
				failureTolerancePercentage: 100,
				maxConcurrentPercentage: 100,
			},
			stackInstancesGroup: [{
				deploymentTargets: {
					organizationalUnitIds: [ props.sandboxOuId ],
				},
				regions: [ region ]
			}],
		})
	}
}