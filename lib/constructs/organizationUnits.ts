import { Construct } from 'constructs'
import { OrganizationalUnit } from './customResources/organizationalUnit'

interface OrganizationUnitsProps {
	rootOrganizationId: string
}

export class OrganizationUnits extends Construct {
	public readonly sandboxOu: OrganizationalUnit

	constructor(scope: Construct, id: string, props: OrganizationUnitsProps){
		super(scope, id)

		this.sandboxOu = new OrganizationalUnit(scope, 'Sandbox', {
			organizationParentId: props.rootOrganizationId,
			organizationalUnitName: 'Sandbox'
		})

		new OrganizationalUnit(scope, 'PendingDeletionAccounts', {
			organizationParentId: props.rootOrganizationId,
			organizationalUnitName: 'PendingDeletionAccounts'
		})
	}
}