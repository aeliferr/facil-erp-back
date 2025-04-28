import brazzilianLocale from 'date-fns/locale/pt-BR';
import { Router } from 'express'
import { PrismaClient } from '@prisma/client';
import PdfPrinter from 'pdfmake';
import numberInFull from '../util/numberInFull';
import { format } from 'date-fns';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import verifyToken from '../middlewares/verifyToken';

const prisma = new PrismaClient()

const contractRouter = Router()

contractRouter.use(verifyToken);

contractRouter.get('/contract/from-budget/:budgetId/print', async (req, res) => {
    try {
        const { budgetId } = req.params

        const budget = await prisma.budget.findUniqueOrThrow({
            where: {
                id: budgetId
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
                        { text: 'DE UM LADO A EMPRESA '},
                        { text: 'A L FERRARI MOVEIS', bold: true }, 
                        ' SITUADA NO ENDEREÇO ACIMA CITADO, CNPJ 31.696.626/0001-08, DAQUI EM DIANTE SIMPLESMENTE CHAMADA DE ',
                        { text: 'CONTRATADA', bold: true },
                        ', E DO OUTRO LADO, ',
                        { text: budget.client.name, bold: true },
                        `, PORTADOR DO CPF: CPF DO CLIENTE, RG: RG DO CLIENTE, ESTABELECIDO NA ${budget.client.street || ''}, ${budget.client.number || ''}, ${budget.client.complement || ''}, ${budget.client.zipcode || ''}, ${budget.client.city || ''} - ${budget.client.state || ''}. DAQUI POR DIANTE SIMPLESMENTE CHAMADO DE `,
                        { text: 'CONTRATANTE', bold: true },
                        ', TEM ENTRE SI JUSTO E CONTRATADO OS SERVIÇOS E MÓVEIS A SEREM EXECUTADOS, CONFORME DESCRIÇÃO A SEGUIR E PROJETOS APRESENTADOS.'
                    ]
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
                    text: `O custo será de R$ ${new Intl.NumberFormat('pt-Br', { style: 'currency', currency: 'BRL' }).format(totalValue)}, conforme orçamento apresentado, que será pago da seguinte maneira:\n`
                },
                {
                    ul: [
                        `Entrada no valor de R$ ${new Intl.NumberFormat('pt-Br', { style: 'currency', currency: 'BRL' }).format(totalValue * 0.4)} (${numberInFull(totalValue * 0.4)} Reais)`,
                        'O restante na entrega dos móveis combinados, em depósito bancário na conta da empresa.'
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

export default contractRouter