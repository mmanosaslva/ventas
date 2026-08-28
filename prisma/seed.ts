import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@abimarine.com'
  const adminPassword = 'Admin2026!'

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existing) {
    console.log('Admin user already exists')
    return
  }

  const hashedPassword = await hash(adminPassword, 12)

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      role: 'admin'
    }
  })

  console.log('Admin user created:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
