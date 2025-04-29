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
                return res.status(401).send('Invalid credentials');
            }
            const token = jwt.sign({ id: user.id, username: user.fullName, role: user.role, tenantId: user.tenantId }, SECRET_KEY, { expiresIn: '8h' });
            setTenantContext(user.tenantId)
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
              })
            res.json();
        } catch (error) {
            console.error(error);
            return res.status(500).send('Server error');
        }
    })

export default loginRouter