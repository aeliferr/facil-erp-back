const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcrypt');
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const hashedPassword = hashSync('admin', 8);
console.log(hashedPassword);

async function main() {
  const imagePath = path.resolve(__dirname, '../src/assets/logo_artfaav_rgb.png')

  // Lê o arquivo e transforma em Buffer
  const imageBuffer = fs.readFileSync(imagePath)

  const tenant = await prisma.tenant.upsert({
    where: {
      name: 'Admin',
      document: '123456789'
    },
    create: {
      name: 'Admin',
      document: '123456789',
      personType: 'juridica',
      logo: imageBuffer.toString('base64')
    },
    update: {}
  })

  const user = await prisma.user.upsert({
    where: { email: 'admin@teste.com' },
    update: {},
    create: {
      email: 'admin@teste.com',
      password: hashedPassword,
      fullName: "Administrador",
      role: 'admin',
      tenant: {
        connect: {
          id: tenant.id
        }
      }
    },
  })

  await prisma.user.upsert({
    where: { email: 'vendor@teste.com' },
    update: {},
    create: {
      email: 'vendor@teste.com',
      password: hashedPassword,
      fullName: "Vendedor",
      role: 'vendor',
      tenantId: tenant.id
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })