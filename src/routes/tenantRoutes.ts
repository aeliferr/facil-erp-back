import { Router } from "express";
import prisma from "../lib/prisma";
import generateToken from "../util/generateToken";
import { hashToken } from "../util/hashToken";
import { sendWelcomeMail } from "../lib/mailjet";

const tenantRouter = Router()

tenantRouter.get('/', async (req, res) => {
    res.json('pong')
})

tenantRouter.post('/signup', async (req, res) => {
    try {
        const { personType, name, document, email, username } = req.body

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

        return res.status(201).json({ message: 'Conta criada com sucesso' })
    } catch (err: any) {
        console.error(err)
        return res.status(400).json({ error: err.message || 'Erro na criação da conta' })
    }
})

export default tenantRouter