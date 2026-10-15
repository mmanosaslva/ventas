import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { comboInclude, parseComboBody } from '@/lib/combos'

type Params = { params: { id: string } }

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Combo no válido' }, { status: 400 })
    }

    const parsed = await parseComboBody(await request.json())
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { name, price, items } = parsed.data

    const duplicate = await prisma.combo.findFirst({ where: { name, NOT: { id } } })
    if (duplicate) {
      return NextResponse.json({ error: 'Ya existe un combo con ese nombre' }, { status: 409 })
    }

    const [, combo] = await prisma.$transaction([
      prisma.comboItem.deleteMany({ where: { comboId: id } }),
      prisma.combo.update({
        where: { id },
        data: { name, price, items: { create: items } },
        include: comboInclude
      })
    ])

    return NextResponse.json(combo)
  } catch (error) {
    console.error('PUT combo error:', error)
    return NextResponse.json({ error: 'Error al actualizar combo' }, { status: 500 })
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
      return NextResponse.json({ error: 'Combo no válido' }, { status: 400 })
    }

    const combo = await prisma.combo.delete({ where: { id } })
    return NextResponse.json(combo)
  } catch (error) {
    console.error('DELETE combo error:', error)
    return NextResponse.json({ error: 'Error al eliminar combo' }, { status: 500 })
  }
}
