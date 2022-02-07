import { Construct } from 'constructs'
import { custom_resources } from 'aws-cdk-lib'

interface OrganizationalUnitProps {
	organizationalUnitName: string
	organizationParentId: string
}

export class OrganizationalUnit extends Construct {

	public readonly id: string
	private readonly region: string
	public readonly name: string

	constructor(scope: Construct, id: string, props: OrganizationalUnitProps){
		super(scope, id)

		this.region = 'us-east-1'
		this.name = props.organizationalUnitName

		const ouCustomResource = new custom_resources.AwsCustomResource(scope, `${props.organizationalUnitName}OU`, {
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

		this.id = ouCustomResource.getResponseField('OrganizationalUnit.Id')
	}
}