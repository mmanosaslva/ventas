import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { comboInclude, parseComboBody } from '@/lib/combos'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const combos = await prisma.combo.findMany({
      include: comboInclude,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(combos)
  } catch (error) {
    console.error('GET combos error:', error)
    return NextResponse.json({ error: 'Error al obtener combos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const parsed = await parseComboBody(await request.json())
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const { name, price, items } = parsed.data

    const existing = await prisma.combo.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un combo con ese nombre' }, { status: 409 })
    }

    const combo = await prisma.combo.create({
      data: { name, price, items: { create: items } },
      include: comboInclude
    })

    return NextResponse.json(combo)
  } catch (error) {
    console.error('POST combo error:', error)
    return NextResponse.json({ error: 'Error al crear combo' }, { status: 500 })
  }
}
