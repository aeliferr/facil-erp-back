import PdfPrinter from "pdfmake";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { TDocumentDefinitions } from "pdfmake/interfaces";
const prisma = new PrismaClient()

const budgetRouter = Router()


budgetRouter.post('/budget', async (req, res) => {
    try {
        const { clientId, budgetItems } = req.body
        const { user } = req

        const budget = {
            clientId,
            vendorId: user!.id,
            budgetItems
        }

        await prisma.budget.create({
            data: {
                budgetItems: {
                    create: budget.budgetItems
                },
                client: {
                    connect: {
                        id: clientId,
                    }
                },
                vendor: {
                    connect: {
                        id: user!.id
                    }
                }
            }
        })

        res.status(200).send()
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

budgetRouter.put('/budget/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { clientId, budgetItems } = req.body

        const { user } = req

        const budget = {
            clientId,
            vendorId: user!.id,
            budgetItems
        }

        await prisma.budget.update({
            where: {
                id
            },
            data: {
                clientId: budget.clientId,
                budgetItems: {
                    deleteMany: {
                        budgetId: id
                    },
                    createMany: {
                        data: budget.budgetItems
                    },
                },
            }
        })

        res.status(200).send()
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

budgetRouter.get('/budget', async (req, res) => {
    try {
        const { user } = req

        const result = await prisma.budget.findMany({
            where: user!.role === 'vendor' ? { vendorId: user!.id } : {},
            include: {
                budgetItems: true,
                vendor: true,
                client: true
            }
        })

        res.json(result)
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
});

budgetRouter.get('/budget/:id', async (req, res) => {
    try {
        const { id } = req.params

        const budget = await prisma.budget.findUnique({
            where: {
                id
            },
            include: {
                vendor: true,
                budgetItems: true
            }
        })

        res.json(budget)
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
});

budgetRouter.get('/budget/:id/print', async (req, res) => {
    try {
        const { id } = req.params

        const budget = await prisma.budget.findUnique({
            where: {
                id
            },
            include: {
                vendor: true,
                budgetItems: true,
                client: true
            }
        })

        // Define font files
        var fonts = {
            Roboto: {
                normal: `${__dirname}/fonts/Roboto-Regular.ttf`,
                bold: `${__dirname}/fonts/Roboto-Medium.ttf`,
                italics: `${__dirname}/fonts/Roboto-Italic.ttf`,
                bolditalics: `${__dirname}/fonts/Roboto-MediumItalic.ttf`
            }
        };

        var printer = new PdfPrinter(fonts);


        let itemId = 0
        let totalValue = 0

        const budgetItems = budget!.budgetItems.map((item) => {
            itemId++
            totalValue += item.quantity * item.unitValue
            return [
                itemId,
                item.description,
                { text: new Intl.NumberFormat('pt-Br', { style: 'currency', currency: 'BRL' }).format(item.unitValue), alignment: 'right' },
                item.quantity,
                { text: new Intl.NumberFormat('pt-Br', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unitValue), alignment: 'right' }
            ]
        })

        budgetItems.push([
            '',
            '',
            {
                colSpan: 3,
                text: `Valor Total: ${new Intl.NumberFormat('pt-Br', { style: 'currency', currency: 'BRL' }).format(totalValue)}`,
                bold: true,
                fontSize: 14,
                alignment: 'right',
                margin: [0, 20, 0, 0]
            }
        ])

        var dd: TDocumentDefinitions = {
            pageMargins: [20, 30, 20, 20], // [left, top, right, bottom]
            pageSize: 'A4',
            content: [
                {
                    image: `${__dirname}/logo_artfaav_rgb.png`,
                    width: 150,
                    style: 'center'
                },
                {
                    text: `Cliente: ${budget!.client.name}`,
                    style: 'subheader',
                    alignment: 'left'
                },
                {
                    text: `Data de validade: ${new Date().toLocaleDateString('pt-Br')}`,
                    style: 'subheader',
                    alignment: 'left'
                },
                {
                    text: `Vendedor: ${budget!.vendor.fullName}`,
                    style: 'subheader',
                    alignment: 'left'
                },
                {
                    margin: [0, 20, 0, 0],
                    table: {
                        headerRows: 1,
                        widths: [15, '*', 75, 25, 100],
                        body: [
                            [
                                { text: 'ID', bold: true },
                                { text: 'Descrição', bold: true },
                                { text: 'Valor unitário', bold: true, alignment: 'right' },
                                { text: 'Qtd.', bold: true },
                                { text: 'Total', bold: true, alignment: 'right' }
                            ],
                            ...budgetItems,
                            // Add more rows as needed
                        ]
                    },
                    layout: 'lightHorizontalLines' // Optional layout style
                }
            ],
            styles: {
                center: {
                    alignment: 'center'
                },
                left: {
                    alignment: 'left'
                },
                subheader: {
                    fontSize: 12,
                    margin: [0, 10, 0, 0] // Top, right, bottom, left margins
                }
            }

        }

        var options = {
            // ...
        }

        var chunks: Uint8Array[] = [];

        var pdfDoc = printer.createPdfKitDocument(dd, options);

        pdfDoc.on('data', (chunk) => {
            chunks.push(chunk)
        })

        pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks)
            res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
            res.setHeader('Content-Type', 'application/pdf');
            res.contentType('application/pdf')
            res.send(result)
        })

        pdfDoc.end()
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
});

export default budgetRouter