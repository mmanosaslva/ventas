import { PrismaClient } from '@prisma/client'

// Datos de ejemplo SOLO para entornos locales. Se niega a correr contra otra base.
const host = new URL(process.env.DATABASE_URL ?? 'postgresql://invalid').hostname
if (!['localhost', '127.0.0.1'].includes(host)) {
  console.error(`seed-demo cancelada: DATABASE_URL apunta a "${host}", no a una base local.`)
  process.exit(1)
}

const prisma = new PrismaClient()

// stock: null = sin control de inventario
const products = [
  { name: 'Hamburguesa', price: 12000, stock: 20 },
  { name: 'Papas fritas', price: 5000, stock: 30 },
  { name: 'Gaseosa', price: 3000, stock: 40 },
  { name: 'Perro caliente', price: 8000, stock: 4 }, // stock bajo
  { name: 'Cerveza', price: 5000, stock: 0 }, // agotado
  { name: 'Jugo natural', price: 4000, stock: null }, // sin control
  { name: 'Postre del día', price: null, stock: 10 } // sin precio
]

const combos = [
  {
    name: 'Combo hamburguesa',
    price: 18000,
    items: [['Hamburguesa', 1], ['Papas fritas', 1], ['Gaseosa', 1]]
  },
  { name: 'Dúo de papas', price: 8000, items: [['Papas fritas', 2]] },
  { name: 'Combo perro', price: 10500, items: [['Perro caliente', 1], ['Gaseosa', 1]] },
  { name: 'Dúo cervecero', price: 9000, items: [['Cerveza', 2]] } // no vendible: cerveza agotada
] as const

async function main() {
  for (const p of products) {
    await prisma.product.upsert({ where: { name: p.name }, update: {}, create: p })
  }

  const byName = new Map((await prisma.product.findMany()).map(p => [p.name, p.id]))

  for (const c of combos) {
    const existing = await prisma.combo.findUnique({ where: { name: c.name } })
    if (existing) continue
    await prisma.combo.create({
      data: {
        name: c.name,
        price: c.price,
        items: {
          create: c.items.map(([name, quantity]) => ({
            productId: byName.get(name)!,
            quantity
          }))
        }
      }
    })
  }

  console.log(`Demo lista: ${products.length} productos y ${combos.length} combos.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
