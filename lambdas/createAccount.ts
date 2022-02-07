import { 
	OrganizationsClient, 
	CreateAccountCommand, 
	MoveAccountCommand,
	CreateAccountState,
	DescribeCreateAccountStatusCommand
} from "@aws-sdk/client-organizations"
import { 
	AccountClient, 
	PutAlternateContactCommand 
} from "@aws-sdk/client-account"

type createAccountEvent = {
	email: string
}

const createAccount = async (organizationsClient: OrganizationsClient, email: string): Promise<string> => {
	const command = new CreateAccountCommand({
		AccountName: email.split('@')[0],
		Email: email
	})
	const response = await organizationsClient.send(command)

	if(!response.CreateAccountStatus || !response.CreateAccountStatus?.Id) {
		throw new Error(`Error while creating account for ${email}`)
	}

	return response.CreateAccountStatus.Id
}

const waitForAccountCreation = async (organizationsClient: OrganizationsClient, createAccountRequestId: string) : Promise<string> => { 
	return new Promise((resolve, reject) => {
		const poll = async () => {
			const command = new DescribeCreateAccountStatusCommand({
				CreateAccountRequestId: createAccountRequestId
			})
			const result = await organizationsClient.send(command)
			if (!result.CreateAccountStatus){
				return reject(`No CreateAccountStatus for ${createAccountRequestId}`)
			}
			const createAccountStatus = result.CreateAccountStatus

			const {
				State,
				AccountId
			} = createAccountStatus 

			switch (State) {
				case CreateAccountState.SUCCEEDED:
					AccountId 
						? resolve(AccountId) 
						: reject('Unable to create Account, AccountId undefined')
					break
				
				case CreateAccountState.IN_PROGRESS:
					console.log('Account creation IN_PROGRESS')
					setTimeout(poll, 5000)
					break
				
				default:
					reject('Unable to create account')
					break

			}
		}
		poll()
	})
}

const moveAccount = async (
	organizationsClient: OrganizationsClient, 
	accountId: string, 
	destinationOUId: string,
	rootOrganizationId: string
	) => {
	const command = new MoveAccountCommand({
		AccountId: accountId,
		DestinationParentId: destinationOUId,
		SourceParentId: rootOrganizationId
	})
	await organizationsClient.send(command)
}

const addAlternateContact = async (accountClient: AccountClient, accountId: string, alternateEmail: string, alternateContactType: string, phoneNumber: string, ) => {
	const command = new PutAlternateContactCommand({
		AccountId: accountId,
		AlternateContactType: alternateContactType,
		EmailAddress: alternateEmail,
		Name: `${alternateEmail.split('@')[0]}`,
		PhoneNumber: phoneNumber,
		Title: `${alternateContactType.toLowerCase()}-contact`
	})

	await accountClient.send(command)
}

export const handler = async (event: createAccountEvent) => {
	console.log(JSON.stringify(event))

	if (!process.env.DESTINATION_OU) {
		throw ('Missing DESTINATION_OU in environment variables')
	}
	if (!process.env.ROOT_OU) {
		throw ('Missing ROOT_OU in environment variables')
	}
	if (!process.env.EMAIL) {
		throw ('Missing EMAIL in environment variables')
	}

	const organizationsClient = new OrganizationsClient({})

	const createAccountRequestId = await createAccount(organizationsClient, event.email)
	const accountId = await waitForAccountCreation(organizationsClient, createAccountRequestId)

	await moveAccount(organizationsClient, accountId, process.env.DESTINATION_OU, process.env.ROOT_OU)

	const accountClient = new AccountClient({})
	await addAlternateContact(accountClient, accountId, process.env.EMAIL, 'OPERATIONS', '0000000000')
	await addAlternateContact(accountClient, accountId, process.env.EMAIL, 'SECURITY', '0000000000')
	await addAlternateContact(accountClient, accountId, process.env.EMAIL, 'BILLING', '0000000000')

	return { email: event.email, accountId: accountId }
}
