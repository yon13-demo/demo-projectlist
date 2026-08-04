const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'leonard@example.com' },
    update: {},
    create: {
      name: 'Leonard Manurung',
      email: 'leonard@example.com',
    },
  })

  const project = await prisma.project.create({
    data: { name: 'Website Redesign' }
  })

  console.log('Dummy data seeded!')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })