import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { custom_resources } from 'aws-cdk-lib'

interface OrganizationalUnitProps {
	organizationalUnitName: string
	organizationParentId: string
}

export class OrganizationalUnit extends Construct {

	public readonly ouId: string
	private readonly region: string

	constructor(scope: Construct, id: string, props: OrganizationalUnitProps){
		super(scope, id)

		this.region = 'us-east-1'

		new custom_resources.AwsCustomResource(scope, `${props.organizationalUnitName}OU`, {
			policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
				resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE
			}),
			onCreate: {
				action: 'createOrganizationalUnit',
				service: 'Organizations',
				region: this.region,
				parameters: {
					Name: props.organizationalUnitName,
					ParentId: props.organizationParentId
				},
				physicalResourceId: custom_resources.PhysicalResourceId.fromResponse('OrganizationalUnit.Id')
			},
			onDelete: {
				action: 'deleteOrganizationalUnit',
				service: 'Organizations',
				region: this.region,
				parameters: {
					OrganizationalUnitId: new custom_resources.PhysicalResourceIdReference()
				}
			},
			onUpdate: {
				action: 'updateOrganizationalUnit',
				service: 'Organizations',
				region: this.region,
				parameters: {
					Name: props.organizationalUnitName,
					OrganizationalUnitId: new custom_resources.PhysicalResourceIdReference()
				},
				physicalResourceId: custom_resources.PhysicalResourceId.fromResponse('OrganizationalUnit.Id')
			}
		})

		this.ouId = new custom_resources.PhysicalResourceIdReference().toString()
	}
}