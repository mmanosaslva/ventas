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

    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('GET products error:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const price = body.price === null || body.price === undefined || body.price === ''
      ? null
      : parseFloat(body.price)

    if (!name) {
      return NextResponse.json({ error: 'El nombre del producto es obligatorio' }, { status: 400 })
    }

    if (price !== null && (isNaN(price) || price < 0)) {
      return NextResponse.json({ error: 'El precio no es válido' }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Ese producto ya existe en la lista' }, { status: 409 })
    }

    const product = await prisma.product.create({
      data: { name, price }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('POST product error:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
