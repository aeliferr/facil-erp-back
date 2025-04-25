import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'
import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import * as cookie from 'cookie'

const prisma = new PrismaClient()
const SECRET_KEY = process.env.JWT_SECRET as string

// Login endpoint

const loginRouter = Router()

loginRouter.post('/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username,
                }
            });
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.status(401).send('Invalid credentials');
            }
            const token = jwt.sign({ id: user.id, username: user.fullName, role: user.role, tenantId: user.tenantId }, SECRET_KEY, { expiresIn: '8h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 // 1 dia
              })
            res.json();
        } catch (error) {
            console.error(error);
            return res.status(500).send('Server error');
        }
    })

export default loginRouter