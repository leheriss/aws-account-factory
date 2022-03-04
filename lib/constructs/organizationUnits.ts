import { Construct } from 'constructs'
import { OrganizationalUnit } from './customResources/organizationalUnit'
import Scp from './customResources/scp'
import ScpAttachment from './customResources/scpAttachment'

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

		const pendingDeletionOu = new OrganizationalUnit(scope, 'PendingDeletionAccounts', {
			organizationParentId: props.rootOrganizationId,
			organizationalUnitName: 'PendingDeletionAccounts'
		})

		const denyLeaveOrganization = {
			Version: "2012-10-17",
			Statement: [
					{
							Action: [
									"organizations:LeaveOrganization"
							],
							Resource: "*",
							Effect: "Deny"
					}
			]
		}

		const pendingDeletion = {
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "AllowOnlyActionsToDeleteAccount",
					Effect: "Allow",
					Action: [
						"aws-portal:ModifyAccount",
						"aws-portal:View*"
					],
					Resource: [
						"*"
					]
				}
			]
		}

		const denyLeaveOrgaScp = new Scp(this, 'DenyLeaveOrganizationSCP', {
			scpName: 'DenyLeaveOrganization', 
			content: JSON.stringify(denyLeaveOrganization), 
			description: 'Deny leaving the Organization'
		})

		const pendingDeletionScp = new Scp(this, 'PendingDeletionSCP', {
			scpName: 'PendingDeletion', 
			content: JSON.stringify(pendingDeletion), 
			description: 'Deny everything but deleting the account'
		})

		new ScpAttachment(this, `${denyLeaveOrgaScp.name}ToSandboxOu`, {
			scp: denyLeaveOrgaScp,
			ou: this.sandboxOu
		})

		new ScpAttachment(this, `${pendingDeletionScp.name}ToPendingDeletionOu`, {
			scp: pendingDeletionScp, 
			ou: pendingDeletionOu
		})
	}
}