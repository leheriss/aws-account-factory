import { Construct } from "constructs"
import { Annotations, custom_resources } from 'aws-cdk-lib'

type ScpProps = {
	scpName: string
	content: string
	description: string
}

export const checkPolicyContent = (content: string): boolean => {
    return /[\s\S]{1,1000000}/.test(content);
}

export default class Scp extends Construct {
	private readonly region: string
	public readonly name: string
	public readonly id: string

	constructor(scope: Construct, id: string, props: ScpProps){
		super(scope, id)

		this.region = 'us-east-1'
		const policyType = 'SERVICE_CONTROL_POLICY'

		const {
			scpName,
			content,
			description
		} = props

		if (!checkPolicyContent(content)) {
			Annotations.of(this).addError(
			  "The text content of the policy must be valid and between 1 and 1,000,000 characters long"
			)
		}

		const scpCustomResource = new custom_resources.AwsCustomResource(scope, `${scpName}`, {
			policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
				resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
			}),
			onCreate: {
				service: 'Organizations',
				action: 'createPolicy',
				region: this.region,
				parameters: {
					Name: scpName,
					Content: content, 
					Type: policyType,
					Description: description
				},
				physicalResourceId: custom_resources.PhysicalResourceId.fromResponse('Policy.PolicySummary.Id')
			}, 
			onDelete: {
				service: 'Organizations',
				action: 'deletePolicy', 
				region: this.region, 
				parameters: {
					PolicyId: new custom_resources.PhysicalResourceIdReference()
				}
			},
			onUpdate: {
				service: 'Organizations',
				action: 'updatePolicy',
				region: this.region,
				parameters: {
					Content: content,
					PolicyId: new custom_resources.PhysicalResourceIdReference(),
					Name: this.name
				},
				physicalResourceId: custom_resources.PhysicalResourceId.fromResponse('Policy.PolicySummary.Id')
			}
		})

		this.id = scpCustomResource.getResponseField('Policy.PolicySummary.Id')
	}
}