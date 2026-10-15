import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StockError, consumeStock, restoreStock, stockEffect } from '@/lib/inventory'

type Params = { params: { id: string } }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const isAdmin = session.user.role === 'admin'
    const body = await request.json()
    const { productName, saleAmount, paymentMethod } = body
    const quantity = body.quantity === undefined || body.quantity === '' || body.quantity === null
      ? 1
      : parseInt(body.quantity)

    const sale = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findFirst({
        where: { id, ...(isAdmin ? {} : { userId: parseInt(session.user.id) }) }
      })
      if (!existing) return null

      // Devuelve el stock de la venta original y descuenta el de la editada
      await restoreStock(tx, await stockEffect(tx, existing))

      const linked = existing.productId !== null || existing.comboId !== null
      const updated = await tx.sale.update({
        where: { id },
        data: {
          // En ventas con producto/combo vinculado el nombre no se cambia
          ...(linked ? {} : { productName }),
          quantity: quantity > 0 ? quantity : 1,
          saleAmount: parseFloat(saleAmount),
          paymentMethod
        }
      })

      await consumeStock(tx, await stockEffect(tx, updated))
      return updated
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('PUT sale error:', error)
    return NextResponse.json({ error: 'Error al actualizar venta' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const isAdmin = session.user.role === 'admin'

    const deleted = await prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findFirst({
        where: { id, ...(isAdmin ? {} : { userId: parseInt(session.user.id) }) }
      })
      if (!existing) return false

      // Eliminar una venta devuelve las unidades al inventario
      await restoreStock(tx, await stockEffect(tx, existing))
      await tx.sale.delete({ where: { id } })
      return true
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE sale error:', error)
    return NextResponse.json({ error: 'Error al eliminar venta' }, { status: 500 })
  }
}
