import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StockError, consumeStock, stockEffect } from '@/lib/inventory'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'admin'

    const sales = await prisma.sale.findMany({
      where: isAdmin ? {} : { userId: parseInt(session.user.id) },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('GET sales error:', error)
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { saleAmount, paymentMethod } = body
    const quantity = body.quantity === undefined || body.quantity === '' || body.quantity === null
      ? 1
      : parseInt(body.quantity)
    const qty = quantity > 0 ? quantity : 1

    // Si se indica el producto o combo por id, el nombre sale de la base de datos
    let productName: string = body.productName
    let productId: number | null = null
    let comboId: number | null = null

    if (body.productId) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(body.productId) } })
      if (!product) {
        return NextResponse.json({ error: 'El producto ya no existe' }, { status: 404 })
      }
      productId = product.id
      productName = product.name
    } else if (body.comboId) {
      const combo = await prisma.combo.findUnique({ where: { id: parseInt(body.comboId) } })
      if (!combo) {
        return NextResponse.json({ error: 'El combo ya no existe' }, { status: 404 })
      }
      comboId = combo.id
      productName = combo.name
    }

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          productName,
          quantity: qty,
          saleAmount: parseFloat(saleAmount),
          paymentMethod,
          userId: parseInt(session.user.id),
          productId,
          comboId
        }
      })
      await consumeStock(tx, await stockEffect(tx, created))
      return created
    })

    return NextResponse.json(sale)
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('POST sale error:', error)
    return NextResponse.json({ error: 'Error al registrar venta' }, { status: 500 })
  }
}
