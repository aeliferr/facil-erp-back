import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'
const prisma = new PrismaClient()
const SECRET_KEY = 'secret_key'

// Login endpoint
import { Router } from "express";
import { PrismaClient } from '@prisma/client';

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
            const token = jwt.sign({ user }, SECRET_KEY, { expiresIn: '8h' });
            return res.json({ token });
        } catch (error) {
            console.error(error);
            return res.status(500).send('Server error');
        }
    })

export default loginRouter