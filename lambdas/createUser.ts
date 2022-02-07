import { 
	IAMClient, 
	CreateUserCommand, 
	CreateLoginProfileCommand, 
	PutUserPolicyCommand, 
	AddUserToGroupCommand 
} from "@aws-sdk/client-iam"
import { 
	STSClient, 
	AssumeRoleCommand, 
	Credentials 
} from "@aws-sdk/client-sts"
import { generate } from "generate-password"

type CreateUserEvent = {
	email: string
	accountId: string
}

const createUserWithTemporaryPassword = async (iamClient: IAMClient, email: string, accountId: string) => {
	await iamClient.send(new CreateUserCommand({
		UserName: email
	}))
	await iamClient.send(new CreateLoginProfileCommand({
		UserName: email,
		PasswordResetRequired: true,
		Password: generate({
			length: 12,
			numbers: true,
			symbols: true,
			uppercase: true,
			lowercase:true
		})
	})
	)

	await iamClient.send(new AddUserToGroupCommand({
		GroupName: 'StandardUserGroup',
		UserName: email
	}))

	const assumeRolePolicy = {
		Version: "2012-10-17",
		Statement: [{
			Effect: "Allow",
			Action: "sts:AssumeRole",
			Resource: `arn:aws:iam::${accountId}:role/role-user`
		}]
	}

	await iamClient.send(new PutUserPolicyCommand({
		UserName: email,
		PolicyName: 'AssumeRoleUser',
		PolicyDocument: JSON.stringify(assumeRolePolicy)
	}))
}

const assumeRoleCredentials = async (role: string) : Promise<Credentials> => {
	const stsClient = new STSClient({})
		const response = await stsClient.send(new AssumeRoleCommand({
			RoleArn: role,
			RoleSessionName: 'JumpAccountSession'
		}))

		if (!response.Credentials) {
			throw new Error('Could not retrieve credentials from assume role command')
		}
		return response.Credentials
}

export const handler = async (event: CreateUserEvent) => {
	console.log(event)
	if (!process.env.JUMP_ACCOUNT_ID) {
		throw new Error('Missing JUMP_ACCOUNT_ID in environment variables')
	}
	if (!process.env.MGMT_ACCOUNT_ID) {
		throw new Error('Missing MGMT_ACCOUNT_ID in environment variables')
	}
	
	const jumpAccountId = process.env.JUMP_ACCOUNT_ID
	const mgmtAccountId = process.env.MGMT_ACCOUNT_ID

	// If the given JumpAccountId is different from the management account id, 
	// we need to assume a role in it before creating the user
	if (jumpAccountId !== mgmtAccountId) {
		const jumpAccountRole = `arn:aws:iam::${jumpAccountId}:role/role-jump`
		const credentials = await assumeRoleCredentials(jumpAccountRole)
		if (!credentials.AccessKeyId) {
			throw ('Could not retrieve AccessKeyId from credentials')
		}
		if (!credentials.SecretAccessKey) {
			throw ('Could not retrieve SecretAccessKey from credentials')
		}
		const iamClient = new IAMClient({ 
			region: process.env.REGION, 
			credentials: {
				accessKeyId: credentials.AccessKeyId,
				secretAccessKey: credentials.SecretAccessKey,
				sessionToken: credentials.SessionToken,
				expiration: credentials.Expiration
			} 
		})
		await createUserWithTemporaryPassword(iamClient, event.email, event.accountId)
	} else {
		const iamClient = new IAMClient({ region: process.env.REGION })
		await createUserWithTemporaryPassword(iamClient, event.email, event.accountId)
	}
}