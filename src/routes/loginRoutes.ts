import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'
import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import * as cookie from 'cookie'
import { setTenantContext } from '../context/tenant-context';

const prisma = new PrismaClient()
const SECRET_KEY = process.env.JWT_SECRET as string

// Login endpoint

const loginRouter = Router()

loginRouter.post('/', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email,
            }
        });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            res.status(401).send('Invalid credentials')
            return
        }

        setTenantContext(user.tenantId)

        const token = jwt.sign({ id: user.id, username: user.fullName, role: user.role, tenantId: user.tenantId }, SECRET_KEY, { expiresIn: '8h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.ENVIRONMENT === 'prod',
            sameSite: 'lax',
            path: '/',
        })

        res.json({ id: user.id, email, name: user.fullName, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
        return
    }
})

loginRouter.post('/logout', async (req, res) => {
    try {
        res.cookie('token', '', {
            httpOnly: true,
            secure: process.env.ENVIRONMENT === 'prod',
            sameSite: 'lax',
            path: '/',
        })
        res.status(200).send()
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
        return
    }
})

export default loginRouter