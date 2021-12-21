import { Construct } from 'constructs'
import { OrganizationalUnit } from './customResources/organizationalUnit'

interface OrganizationUnitsProps {
	rootOrganizationId: string
}

export class OrganizationUnits extends Construct {
	public readonly sandboxOuId: string

	constructor(scope: Construct, id: string, props: OrganizationUnitsProps){
		super(scope, id)

		const sandboxOu = new OrganizationalUnit(scope, 'Sandbox', {
			organizationParentId: props.rootOrganizationId,
			organizationalUnitName: 'Sandbox'
		})

		this.sandboxOuId = sandboxOu.ouId

		new OrganizationalUnit(scope, 'PendingDeletionAccounts', {
			organizationParentId: props.rootOrganizationId,
			organizationalUnitName: 'PendingDeletionAccounts'
		})
	}
}