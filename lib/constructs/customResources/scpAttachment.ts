import { custom_resources } from "aws-cdk-lib"
import { PhysicalResourceId } from "aws-cdk-lib/custom-resources"
import { Construct } from "constructs"
import { OrganizationalUnit } from "./organizationalUnit"
import Scp from "./scp"

type ScpAttachmentProps = {
	scp: Scp, 
	ou: OrganizationalUnit
}

export default class ScpAttachment extends Construct {
	private readonly region : string

	constructor(scope: Construct, id: string, props: ScpAttachmentProps) {
		super(scope, id)

		const {
			scp,
			ou
		} = props
		
		this.region = 'us-east-1'
		this.node.addDependency(ou, scp)

		new custom_resources.AwsCustomResource(this, `ScpAttachment`, {
			policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
				resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
			}),
			onCreate: {
				service: 'Organizations',
				action: 'attachPolicy',
				region: this.region,
				parameters: {
					PolicyId: scp.id,
					TargetId: ou.id
				},
				physicalResourceId: PhysicalResourceId.of(`${props.scp.name}:${props.ou.name}`)
			}, 
			onDelete: {
				service: 'Organizations',
				action: 'detachPolicy', 
				region: this.region, 
				parameters: {
					PolicyId: scp.id,
					TargetId: ou.id
				}
			}
		})
	}
}