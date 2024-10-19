const prisma = new PrismaClient()

import { Router } from "express";
import { PrismaClient } from '@prisma/client';

const userRouter = Router()


userRouter.get('/me', async (req, res) => {
    try {
        const { user } = req
        const result = await prisma.user.findUnique({
            where: {
                id: user!.id
            }
        })

        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})

export default userRouter