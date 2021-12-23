import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { 
	aws_s3 as s3, 
	aws_cloudtrail as cloudtrail,
	aws_budgets as budgets,
	aws_iam as iam
} from 'aws-cdk-lib'

interface ManagementAccountProps {
	budgetName: string
	budgetEmail: string
	organizationId: string
}

export class ManagementAccount extends Construct {
	constructor (scope: Construct, id: string, props: ManagementAccountProps) {
		super(scope, id)

		const region = cdk.Stack.of(this).region
		const accountId = cdk.Stack.of(this).account
		const trailName = 'OrganizationTrail'

		// Budget

		new budgets.CfnBudget(this, 'CfnBudget', {
			budget: {
				budgetType: 'COST',
				timeUnit: 'MONTHLY',
		
				// the properties below are optional
				budgetLimit: {
					amount: 100,
					unit: 'USD',
				},
				budgetName: props.budgetName,
				costTypes: {
					includeCredit: false,
					includeDiscount: false,
					includeOtherSubscription: false,
					includeRecurring: false,
					includeRefund: false,
					includeSubscription: false,
					includeSupport: false,
					includeTax: false,
					includeUpfront: false,
					useAmortized: false,
					useBlended: false,
				}
			},
		
			notificationsWithSubscribers: [{
				notification: {
					comparisonOperator: 'GREATER_THAN',
					notificationType: 'ACTUAL',
					threshold: 75,
		
					thresholdType: 'PERCENTAGE',
				},
				subscribers: [{
					address: props.budgetEmail,
					subscriptionType: 'EMAIL',
				}]
			},
			{
				notification: {
					comparisonOperator: 'GREATER_THAN',
					notificationType: 'ACTUAL',
					threshold: 99,
		
					thresholdType: 'PERCENTAGE',
				},
				subscribers: [{
					address: props.budgetEmail,
					subscriptionType: 'EMAIL',
				}]
			},
			{
				notification: {
					comparisonOperator: 'GREATER_THAN',
					notificationType: 'FORECASTED',
					threshold: 100,
		
					thresholdType: 'PERCENTAGE',
				},
				subscribers: [{
					address: props.budgetEmail,
					subscriptionType: 'EMAIL',
				}]
			}],
		})

		// Organization Trail

		const trailBucket: s3.Bucket = new s3.Bucket(this, 'OrganizationTrailBucket', {})

		trailBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				resources: [trailBucket.bucketArn],
				actions: [ 's3:GetBucketAcl'],
				principals: [ new iam.ServicePrincipal('cloudtrail.amazonaws.com') ],
				effect: iam.Effect.ALLOW,
				sid: 'AWSCloudTrailAclCheck20150319'
			})
		)
		trailBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				resources: [ `arn:aws:s3:::${trailBucket.bucketName}/AWSLogs/${accountId}/*` ],
				effect: iam.Effect.ALLOW,
				actions: [ 's3:PutObject' ],
				principals: [ new iam.ServicePrincipal('cloudtrail.amazonaws.com') ],
				sid: 'AWSCloudTrailWrite20150319',
				conditions: {
					StringEquals: {
						"s3:x-amz-acl": "bucket-owner-full-control",
						"aws:SourceArn": `arn:aws:cloudtrail:${region}:${accountId}:trail/${trailName}`
					}
				}
			})
		)
		trailBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				resources: [ `arn:aws:s3:::${trailBucket.bucketName}/AWSLogs/${props.organizationId}/*` ],
				effect: iam.Effect.ALLOW,
				actions: [ 's3:PutObject' ],
				principals: [ new iam.ServicePrincipal('cloudtrail.amazonaws.com') ],
				sid: 'AWSCloudTrailWrite20150319',
				conditions: {
					StringEquals: {
						"s3:x-amz-acl": "bucket-owner-full-control",
						"aws:SourceArn": `arn:aws:cloudtrail:${region}:${accountId}:trail/${trailName}`
					}
				}
			})
		)

		new cloudtrail.CfnTrail(this, 'OrganizationTrail', {
			isLogging: true,
			s3BucketName: trailBucket.bucketName,
			isOrganizationTrail: true,
			trailName: trailName
		}	)

		// IAM user group for common policies

		new iam.Group(this, 'StandardUserGroup', {
			groupName: 'StandardUserGroup',
			managedPolicies: [ 
				iam.ManagedPolicy.fromAwsManagedPolicyName('IAMUserChangePassword') 
			]
		})
	}
}



