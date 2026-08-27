import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const sales = await prisma.sale.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(sales)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { productName, saleAmount, paymentMethod } = body

  const sale = await prisma.sale.create({
    data: {
      productName,
      saleAmount: parseFloat(saleAmount),
      paymentMethod,
      userId: parseInt(session.user.id)
    }
  })

  return NextResponse.json(sale)
}