import { OrganizationsClient, CreateAccountCommand } from "@aws-sdk/client-organizations"

type createAccountEvent = {
	email: string
}

const createAccount = async (email: string) => {
	const organizationClient = new OrganizationsClient({region: 'eu-west-1'});
	const command = new CreateAccountCommand({
		AccountName: email.split('@')[0],
		Email: email
	})
	const response = await organizationClient.send(command)
	console.log(response)
}

export const handler = async (event: createAccountEvent) => {
	console.log(JSON.stringify(event))
	createAccount(event.email)
}
