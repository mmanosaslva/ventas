import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Producto no válido' }, { status: 400 })
    }

    const body = await request.json()
    const data: { name?: string; price?: number | null } = {}

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) {
        return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
      }
      const duplicate = await prisma.product.findFirst({
        where: { name, NOT: { id } }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'Ese producto ya existe en la lista' }, { status: 409 })
      }
      data.name = name
    }

    if (body.price !== undefined) {
      if (body.price === null || body.price === '') {
        data.price = null
      } else {
        const price = parseFloat(body.price)
        if (isNaN(price) || price < 0) {
          return NextResponse.json({ error: 'El precio no es válido' }, { status: 400 })
        }
        data.price = price
      }
    }

    const product = await prisma.product.update({ where: { id }, data })
    return NextResponse.json(product)
  } catch (error) {
    console.error('PUT product error:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Producto no válido' }, { status: 400 })
    }

    const product = await prisma.product.delete({ where: { id } })
    return NextResponse.json(product)
  } catch (error) {
    console.error('DELETE product error:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
