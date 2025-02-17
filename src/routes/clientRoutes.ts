import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()

const clientRouter = Router()

clientRouter.get('/clients', async (req, res) => {
    try {
        const result = await prisma.client.findMany()

        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(400).json(error)
    }
})

clientRouter.get('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await prisma.client.findUnique({
            where: {
                id
            }
        })

        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(400).json(error)
    }
})

clientRouter.post('/clients', async (req, res) => {
    try {
        const { name, type, rg, cpf, cnpj, zipcode, street, number, complement, neighborhood, city, state } = req.body

        const { user } = req
        
        await prisma.client.create({
            data: { name, type, rg, cpf, cnpj, zipcode, street, number, complement, neighborhood, city, state }
        })

        res.status(200).send()
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

clientRouter.put('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, type, rg, cpf, cnpj, zipcode, street, number, complement, neighborhood, city, state } = req.body

        const { user } = req
        
        await prisma.client.update({
            where: { id },
            data: { name, type, rg, cpf, cnpj, zipcode, street, number, complement, neighborhood, city, state }
        })

        res.status(200).send()
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

export default clientRouter