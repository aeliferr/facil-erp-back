const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const bcrypt = require('bcrypt');
const hashedPassword = bcrypt.hashSync('admin', 8);
console.log(hashedPassword);

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: {
      name: 'Admin',
      document: '123456789'
    },
    create: {
      name: 'Admin',
      document: '123456789',
      documentType: 'juridica',
      // responsibleUser: {
      //   create: {
      //     username: 'admin',
      //     password: hashedPassword,
      //     fullName: "Administrador",
      //     role: 'admin',
      //   }
      // }
    },
    update: {}
  })

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
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



  // await prisma.tenant.upsert({
  //   where: {
  //     name: 'Admin'
  //   },
  //   create: {
  //     name: 'admin',
  //     document: '123456789',
  //     documentType: 'juridica',
  //     responsibleUser: {
  //       connect: {
  //         id: user.id
  //       }
  //     }
  //   },
  //   update: {}
  // })

  await prisma.user.upsert({
    where: { username: 'vendor' },
    update: {},
    create: {
      username: 'vendor',
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