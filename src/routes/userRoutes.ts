import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import verifyToken from "../middlewares/verifyToken";
import generateToken from "../util/generateToken";
import { hashToken } from "../util/hashToken";
import { sendPasswordRecoveryMail } from "../lib/mailjet";

const prisma = new PrismaClient()

const userRouter = Router()

userRouter.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos

    await prisma.passwordReset.create({
        data: {
            email,
            token,
            expiresAt,
        },
    });

    sendPasswordRecoveryMail(email, token)

    return res.json({ message: "E-mail de recuperação enviado" });
});

userRouter.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;

    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.used || (reset.expiresAt && reset.expiresAt < new Date())) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
    }

    const hashedPassword = await hashToken(password);

    await prisma.$transaction([
        prisma.user.update({
            where: { email: reset.email },
            data: { password: hashedPassword },
        }),
        prisma.passwordReset.update({
            where: { id: reset.id },
            data: { used: true },
        }),
    ]);

    return res.json({ message: "Senha alterada com sucesso" });
});

userRouter.use(verifyToken)

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