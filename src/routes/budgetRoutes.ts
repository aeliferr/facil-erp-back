import PdfPrinter from "pdfmake";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { addMonths, format } from "date-fns";
import brazzilianLocale from 'date-fns/locale/pt-BR';
import numberInFull from "../util/numberInFull";
import { auth } from "../middlewares/authorization";

const prisma = new PrismaClient()

const budgetRouter = Router()


budgetRouter.post('/budgets', async (req, res) => {
    try {
        const budgetData = req.body
        const { user } = req

        //TODO: pegar id do vendedor a partir do usuario que vem na requisicao
        const budget = { ...budgetData, vendorId: user?.id }

        await prisma.budget.create({
            data: {
                ...budget,
                clientId: undefined,
                vendorId: undefined,
                budgetItems: {
                    create: budget.budgetItems
                },
                client: {
                    connect: {
                        id: budget.clientId,
                    }
                },
                vendor: {
                    connect: {
                        id: budget.vendorId
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

budgetRouter.put('/budgets/:id', async (req, res) => {
    try {
        const { id } = req.params
        const {
            clientId,
            daysAfterDefinitionAndMeasurement,
            downPaymentPercentage,
            installment,
            paymentMethod,
            workDays, budgetItems
        } = req.body

        const { user } = req

        const budget = {
            clientId,
            vendorId: '668cfb63-b706-4ab8-8be0-40e2ed3bd38b',
            budgetItems
        }

        await prisma.budget.update({
            where: {
                id
            },
            data: {
                clientId: budget.clientId,
                daysAfterDefinitionAndMeasurement,
                downPaymentPercentage,
                installment,
                paymentMethod,
                workDays,
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

budgetRouter.get('/budgets', async (req, res) => {
    try {
        const { user } = req

        const where = user?.role === 'vendor' ? { vendorId: user.id } : {}
        const result = await prisma.budget.findMany({
            where,
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

budgetRouter.get('/budgets/:id', async (req, res) => {
    try {
        const { id } = req.params

        const budget = await prisma.budget.findUnique({
            where: {
                id
            },
            include: {
                vendor: true,
                client: true,
                budgetItems: true
            }
        })

        res.json(budget)
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
});

budgetRouter.get('/budgets/:id/print', async (req, res) => {
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
                normal: `${__dirname}/../assets/fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${__dirname}/../assets/fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${__dirname}/../assets/fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${__dirname}/../assets/fonts/Roboto/Roboto-MediumItalic.ttf`
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
                    image: `${__dirname}/../assets/logo_artfaav_rgb.png`,
                    width: 150,
                    style: 'center'
                },
                {
                    text: `Cliente: ${budget!.client.name}`,
                    style: 'subheader',
                    alignment: 'left'
                },
                {
                    text: `Data de validade: ${format(addMonths(new Date(), 1), 'dd/MM/yyyy')}`,
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
        pdfDoc.info.Title = "Orçamento"

        pdfDoc.on('data', (chunk) => {
            chunks.push(chunk)
        })

        pdfDoc.on('end', () => {
            const result = Buffer.concat(chunks)
            res.setHeader('Content-Disposition', 'filename="invoice.pdf"');
            res.setHeader('Content-Type', 'application/pdf; name="MyFile.pdf"');
            res.contentType('application/pdf; name="MyFile.pdf"')
            res.send(result)
        })

        pdfDoc.end()
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
});

budgetRouter.get('/budgets/:id/contract/print', async (req, res) => {
    try {
        const { id } = req.params

        const budget = await prisma.budget.findUniqueOrThrow({
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
                normal: `${__dirname}/../assets/fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${__dirname}/../assets/fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${__dirname}/../assets/fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${__dirname}/../assets/fonts/Roboto/Roboto-MediumItalic.ttf`
            }
        };

        var printer = new PdfPrinter(fonts);


        let itemId = 0
        let totalValue = 0

        const budgetItemsDescription = budget.budgetItems.map((item) => {
            itemId++
            totalValue += item.unitValue * item.quantity
            return `${itemId} - ${item.description}`
        })

        const clientIdentification =
            budget.client.type === 'fisica'
                ? `PORTADOR DO CPF: ${budget.client || '---'}, RG: ${budget.client.rg || '---'}`
                : `INSCRITA NO CNPJ: ${budget.client.cnpj || '---'}`

        // Filtra o endereço omitindo os campos nulos ou vazios
        const endereco = [
            budget.client.street,
            budget.client.number,
            budget.client.complement,
            budget.client.zipcode,
            budget.client.city,
            budget.client.state,
        ]
            .filter(Boolean) // Remove null, undefined e strings vazias
            .join(', ')

        const downPaymentValue = (budget.downPaymentPercentage / 100) * totalValue
        const remainingValue = totalValue - downPaymentValue

        var dd: TDocumentDefinitions = {
            pageMargins: [40, 30, 40, 20], // [left, top, right, bottom]
            pageSize: 'A4',
            content: [
                {
                    image: `${__dirname}/../assets/logo_artfaav_rgb.png`,
                    width: 150,
                    style: 'center',
                    alignment: 'center'
                },
                {
                    text: 'RUA PEDRO MARTINS Nº380 – MINI DIST. IND. ADAIL VETORAZZO\nSÃO JOSE DO RIO PRETO - SP\nFONE: 17 – 3513-0326',
                    style: 'subheader'
                },
                {
                    text: '\n\nCONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇO\n\n',
                    style: 'title'
                },
                {
                    text: [
                        { text: 'DE UM LADO A EMPRESA ' },
                        { text: 'A L FERRARI MOVEIS', bold: true },
                        ' SITUADA NO ENDEREÇO ACIMA CITADO, CNPJ 31.696.626/0001-08, DAQUI EM DIANTE SIMPLESMENTE CHAMADA DE ',
                        { text: 'CONTRATADA', bold: true },
                        ', E DO OUTRO LADO, ',
                        { text: budget.client.name, bold: true },
                        `, ${clientIdentification}, ESTABELECIDO NA ${endereco}. DAQUI POR DIANTE SIMPLESMENTE CHAMADO DE `,
                        { text: 'CONTRATANTE', bold: true },
                        ', TEM ENTRE SI JUSTO E CONTRATADO OS SERVIÇOS E MÓVEIS A SEREM EXECUTADOS, CONFORME DESCRIÇÃO A SEGUIR E PROJETOS APRESENTADOS.',
                    ],
                },
                {
                    text: '\n1a) CONFECÇÃO E MONTAGEM CONFORME DESCRITO ABAIXO:\n',
                    style: 'section'
                },
                {
                    ul: budgetItemsDescription
                },
                {
                    text: '\n2a) VALORES E FORMA DE PAGAMENTO:',
                    style: 'section'
                },
                {
                    text: `O custo será de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}, conforme orçamento apresentado, com forma de pagamento por ${paymentMethodLabel(budget.paymentMethod)}, sendo:\n`
                },
                {
                    text: '\nForma de pagamento:\n'
                },
                {
                    ul: [
                        `Entrada de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(downPaymentValue)} (${numberInFull(downPaymentValue)} reais), equivalente a ${budget.downPaymentPercentage}% do valor total.`,
                        `O restante em ${budget.installment} parcela(s), totalizando ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingValue)}.`
                    ]
                },
                {
                    text: '\n3a) MÓVEIS SERÃO FABRICADOS E ENTREGUES EM 60 DIAS APÓS DEFINIÇÃO DO PROJETO E MEDIÇÃO PARA EXECUÇÃO.',
                    style: 'section'
                },
                {
                    text: '\n4a) GARANTIA:',
                    style: 'section'
                },
                {
                    text: 'A CONTRATADA DARA AO CONTRATANTE, ALÉM DA GARANTIA DE 90 DIAS DE QUE TRATA O CÓDIGO DO CONSUMIDOR, UMA GARANTIA COMPLEMENTAR DE 1 ANO SOBRE A PARTE ESTRUTURAL DOS MÓVEIS.'
                },
                {
                    text: `\nSÃO JOSÉ DO RIO PRETO, ${format(new Date(), 'PPPP', {
                        locale: {
                            formatLong: brazzilianLocale.ptBR.formatLong,
                            localize: brazzilianLocale.ptBR.localize
                        }
                    })}\n\n`,
                    style: 'date'
                },
                {
                    columns: [
                        {
                            text: '___________________________________\nA L FERRARI MOVEIS',
                            style: 'signature',
                            alignment: 'center'
                        },
                        {
                            text: `____________________________________\n${budget.client.name}`,
                            style: 'signature',
                            alignment: 'center'
                        }
                    ]
                }
            ],
            styles: {
                subheader: {
                    fontSize: 10,
                    alignment: 'center'
                },
                title: {
                    fontSize: 12,
                    bold: true,
                    alignment: 'center'
                },
                section: {
                    fontSize: 12,
                    bold: true
                },
                date: {
                    fontSize: 12,
                    alignment: 'center'
                },
                signature: {
                    fontSize: 12,
                    margin: [0, 50, 0, 0]
                }
            },
            defaultStyle: {
                fontSize: 12
            }
        };

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
            res.setHeader('Content-Disposition', 'filename="invoice.pdf"');
            res.setHeader('Content-Type', 'application/pdf; name="MyFile.pdf"');
            res.contentType('application/pdf; name="MyFile.pdf"')
            res.send(result)
        })

        pdfDoc.end()
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
});

function paymentMethodLabel(method: string) {
    const labels: Record<string, string> = {
        credit: 'cartão de crédito',
        debit: 'cartão de débito',
        boleto: 'boleto bancário',
        pix: 'PIX',
        money: 'dinheiro',
    }
    return labels[method] || method
}

export default budgetRouter