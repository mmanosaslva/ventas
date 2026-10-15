import { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

export class StockError extends Error {}

type SaleRef = { productId: number | null; comboId: number | null; quantity: number }

// Unidades de cada producto que consume una venta (un combo consume cada uno de sus artículos)
export async function stockEffect(tx: Tx, sale: SaleRef): Promise<Map<number, number>> {
  const effect = new Map<number, number>()
  if (sale.productId) {
    effect.set(sale.productId, sale.quantity)
  } else if (sale.comboId) {
    const items = await tx.comboItem.findMany({ where: { comboId: sale.comboId } })
    for (const item of items) {
      effect.set(item.productId, (effect.get(item.productId) ?? 0) + item.quantity * sale.quantity)
    }
  }
  return effect
}

// Descuenta stock; los productos sin control (stock null) se ignoran.
// El decremento es condicional para que dos ventas simultáneas no dejen el stock en negativo.
export async function consumeStock(tx: Tx, effect: Map<number, number>) {
  for (const [productId, units] of Array.from(effect)) {
    const product = await tx.product.findUnique({ where: { id: productId } })
    if (!product || product.stock === null) continue

    const res = await tx.product.updateMany({
      where: { id: productId, stock: { gte: units } },
      data: { stock: { decrement: units } }
    })
    if (res.count === 0) {
      throw new StockError(
        `Stock insuficiente de "${product.name}": hay ${product.stock} y se necesitan ${units}`
      )
    }
  }
}

export async function restoreStock(tx: Tx, effect: Map<number, number>) {
  for (const [productId, units] of Array.from(effect)) {
    await tx.product.updateMany({
      where: { id: productId, stock: { not: null } },
      data: { stock: { increment: units } }
    })
  }
}

// undefined = no vino en el body; null = sin control de inventario
export function parseStock(value: unknown): number | null | undefined | 'invalid' {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : 'invalid'
}
