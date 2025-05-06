import { Router } from "express";
import prisma from "../lib/prisma";
import generateToken from "../util/generateToken";
import { hashToken } from "../util/hashToken";
import { sendWelcomeMail } from "../lib/mailjet";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY as string)


const tenantRouter = Router()

tenantRouter.post('/create-setup-intent', async (req, res) => {
    try {
        const { name, email } = req.body

        const customer = await stripe.customers.create({
            name,
            email
        })

        const setupIntent = await stripe.setupIntents.create({
            customer: customer.id
        })

        res.status(201).json({ clientSecret: setupIntent.client_secret, customerId: customer.id })
    } catch (error) {
        res.status(500).json(error)
    }
})

tenantRouter.post('/sign-up', async (req, res) => {
    try {
        const { company, user, customerId, paymentMethodId } = req.body

        const existingTenant = await prisma.tenant.findUnique({
            where: {
                document: company.document
            }
        })

        if (existingTenant) {
            res.status(400).json({ error: 'Email já está em uso' })
            return
        }

        const existingEmail = await prisma.user.findFirst({
            where: { email: user.email }
        })

        if (existingEmail) {
            res.status(400).json({ error: 'Email já está em uso.' })
            return
        }

        // Gerar senha temporária ou pedir criação via fluxo separado
        const tempPassword = generateToken()
        const hashedPassword = await hashToken(tempPassword)

        await prisma.tenant.create({
            data: {
                personType: company.personType,
                document: company.document,
                name: company.name,
                stripeCustomerId: customerId,
                logo: company.logo,
                User: {
                    create: {
                        email: user.email,
                        fullName: user.username,
                        password: hashedPassword
                    }
                }
            }
        })

        const token = generateToken();

        await prisma.passwordReset.create({
            data: {
                email: user.email,
                token
            }
        })

        sendWelcomeMail(user.email, token)

        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })

        // Define o cartão como padrão
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        })

        // Cria a assinatura
        await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: 'monthly' === 'monthly' ? 'price_1RKRtNQl3QYVoWPZhLU9QzVI' : 'price_1RKTAcQl3QYVoWPZGoTNXSNc',
                },
            ]
        })

        res.status(201).json({ message: 'Conta criada com sucesso' })
    } catch (err: any) {
        console.error(err)
        res.status(400).json({ error: err.message || 'Erro na criação da conta' })
    }
})

export default tenantRouter