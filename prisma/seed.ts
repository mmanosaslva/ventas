import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@abimarine.com'
  const adminPassword = 'Admin2026'

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  const hashedPassword = await hash(adminPassword, 12)

  if (existing) {
    const admin = await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword }
    })
    console.log('Admin password updated:', admin.email)
    return
  }

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
