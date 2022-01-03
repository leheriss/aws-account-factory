import { IAMClient, CreateUserCommand, CreateLoginProfileCommand, AttachUserPolicyCommand, PutUserPolicyCommand, AddUserToGroupCommand } from "@aws-sdk/client-iam"
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

export const handler = (event: CreateUserEvent) => {
	console.log(event)
	if (!process.env.REGION) {
		throw ('Missing REGION in environment variables')
	}	
	const iamClient = new IAMClient({ region: process.env.REGION })
	console.log(event.accountId)
	createUserWithTemporaryPassword(iamClient, event.email, event.accountId).then(() => {
		console.log(`User ${event.email} created.`)
	})
}