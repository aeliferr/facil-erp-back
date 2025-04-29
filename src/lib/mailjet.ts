import mailjet from "node-mailjet"

const client = mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC as string, process.env.MJ_APIKEY_PRIVATE as string)

export function sendPasswordRecoveryMail(email: string, token: string) {
    const request = client.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: {
                    Email: process.env.EMAIL_FOR_MESSAGE_SENDINGS
                },
                To: [
                    {
                        Email: email,
                    },
                ],
                TemplateID: 6939738,
                TemplateLanguage: true,
                TemplateErrorDeliver: true,
                Variables: {
                    "reset_link": `${process.env.URL_FRONT}/reset-password?token=${token}`,
                    "year": new Date().getFullYear().toString()
                }
            },
        ],
    })
    request
        .then(result => {
            console.log(result.body)
        })
        .catch(err => {
            console.log(err.statusCode)
        })
}

export function sendWelcomeMail(email: string, token: string) {
    const request = client.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: {
                    Email: process.env.EMAIL_FOR_MESSAGE_SENDINGS
                },
                To: [
                    {
                        Email: email,
                    },
                ],
                TemplateID: 6942482,
                TemplateLanguage: true,
                TemplateErrorDeliver: true,
                Variables: {
                    "create_password_link": `${process.env.URL_FRONT}/reset-password?token=${token}`,
                    "year": new Date().getFullYear().toString()
                }
            },
        ],
    })
    request
        .then(result => {
            console.log(result.body)
        })
        .catch(err => {
            console.log(err.statusCode)
        })
}