import { Router } from "express";
import prisma from "../lib/prisma";
import generateToken from "../util/generateToken";
import { hashToken } from "../util/hashToken";
import { sendWelcomeMail } from "../lib/mailjet";
import Stripe from 'stripe';
import multer from 'multer'

const stripeClient = new Stripe(process.env.STRIPE_PRIVATE_KEY as string)

const upload = multer()

const tenantRouter = Router()

tenantRouter.get('/', async (req, res) => {
    res.json('pong')
})

tenantRouter.post('/signup', async (req, res) => {
    try {
        const { personType, name, document, email, username, logo, paymentPeriod, paymentMethodId } = req.body

        const existingTenant = await prisma.tenant.findUnique({
            where: {
                document
            }
        })

        if (existingTenant) {
            return res.status(400).json({ error: 'Email já está em uso' })
        }

        const existingEmail = await prisma.user.findFirst({
            where: { email }
        })

        if (existingEmail) {
            return res.status(400).json({ error: 'Email já está em uso.' })
        }

        // Gerar senha temporária ou pedir criação via fluxo separado
        const tempPassword = generateToken()
        const hashedPassword = await hashToken(tempPassword)

        await prisma.tenant.create({
            data: {
                personType,
                document,
                name,
                logo,
                User: {
                    create: {
                        email,
                        fullName: username,
                        password: hashedPassword
                    }
                }
            }
        })

        const token = generateToken();

        await prisma.passwordReset.create({
            data: {
                email,
                token
            }
        })

        sendWelcomeMail(email, token)

        const customer = await stripeClient.customers.create({
            name,
            email,
            invoice_settings: {
                default_payment_method: 'pmc_1RJlwHQl3QYVoWPZ6sHFGpkJ'
            }
        })
        
        const subscription = await stripeClient.subscriptions.create({
            customer: customer.id,
            items: [
                {
                    price: paymentPeriod === 'monthly' ? 'price_1RKRtNQl3QYVoWPZhLU9QzVI' : 'price_1RKTAcQl3QYVoWPZGoTNXSNc',
                },
            ],
            expand: ['latest_invoice.payment_intent'],
            payment_behavior: 'default_incomplete',
        });

        return res.status(201).json({ message: 'Conta criada com sucesso', subscription })
    } catch (err: any) {
        console.error(err)
        return res.status(400).json({ error: err.message || 'Erro na criação da conta' })
    }
})

export default tenantRouter