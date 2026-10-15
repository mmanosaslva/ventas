import { prisma } from './db'

type RawItem = { productId?: unknown; quantity?: unknown }

export type ComboInput = {
  name: string
  price: number
  items: { productId: number; quantity: number }[]
}

export const comboInclude = {
  items: { include: { product: true }, orderBy: { id: 'asc' as const } }
}

// Valida el body y, si no trae precio, calcula el estimado (suma precio × cantidad)
export async function parseComboBody(
  body: { name?: unknown; price?: unknown; items?: unknown }
): Promise<{ data: ComboInput } | { error: string }> {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return { error: 'El nombre del combo es obligatorio' }

  const rawItems: RawItem[] = Array.isArray(body.items) ? body.items : []
  const merged = new Map<number, number>()
  for (const item of rawItems) {
    const productId = Number(item.productId)
    const quantity = item.quantity === undefined ? 1 : Number(item.quantity)
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return { error: 'Los artículos del combo no son válidos' }
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity)
  }
  const totalUnits = Array.from(merged.values()).reduce((a, b) => a + b, 0)
  if (totalUnits < 2) return { error: 'Un combo necesita al menos 2 artículos (pueden ser repetidos)' }

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(merged.keys()) } }
  })
  if (products.length !== merged.size) return { error: 'Algún producto ya no existe' }

  let price: number
  if (body.price === undefined || body.price === null || body.price === '') {
    price = products.reduce((sum, p) => sum + (p.price ?? 0) * (merged.get(p.id) ?? 0), 0)
  } else {
    price = Number(body.price)
    if (isNaN(price) || price < 0) return { error: 'El precio no es válido' }
  }

  return {
    data: {
      name,
      price,
      items: Array.from(merged, ([productId, quantity]) => ({ productId, quantity }))
    }
  }
}
