import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.$connect()

    const sales = await prisma.sale.findMany({
      where: { userId: parseInt(session.user.id) },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('GET sales error:', error)
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { productName, saleAmount, paymentMethod } = body

    await prisma.$connect()

    const sale = await prisma.sale.create({
      data: {
        productName,
        saleAmount: parseFloat(saleAmount),
        paymentMethod,
        userId: parseInt(session.user.id)
      }
    })

    return NextResponse.json(sale)
  } catch (error) {
    console.error('POST sale error:', error)
    return NextResponse.json(
      { error: 'Error al registrar venta' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}