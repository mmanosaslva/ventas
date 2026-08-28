import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { productName, saleAmount, paymentMethod } = body

    const sale = await prisma.sale.update({
      where: {
        id: parseInt(id),
        userId: parseInt(session.user.id)
      },
      data: {
        productName,
        saleAmount: parseFloat(saleAmount),
        paymentMethod
      }
    })

    return NextResponse.json(sale)
  } catch (error) {
    console.error('PUT sale error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar venta' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await prisma.sale.delete({
      where: {
        id: parseInt(id),
        userId: parseInt(session.user.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE sale error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar venta' },
      { status: 500 }
    )
  }
}
