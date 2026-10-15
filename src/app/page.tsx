'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sale } from '@/lib/types'
import StockBadge from '@/components/StockBadge'
import { LOW_STOCK } from '@/lib/inventory-shared'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<{ id: number; name: string; stock: number }[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session) {
      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => setSales(data))
      fetch('/api/productos')
        .then(res => res.json())
        .then((data: { id: number; name: string; stock: number | null }[]) =>
          setLowStock(
            (Array.isArray(data) ? data : [])
              .filter((p): p is { id: number; name: string; stock: number } => p.stock !== null && p.stock <= LOW_STOCK)
              .sort((a, b) => a.stock - b.stock)
          )
        )
        .catch(() => {})
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return null
  }

  const totalSales = sales.length
  const totalMoney = sales.reduce((sum, sale) => sum + sale.saleAmount, 0)
  const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  // Unidades vendidas por producto o combo
  const productSales = sales.reduce((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantity
    return acc
  }, {} as Record<string, number>)

  const recent = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="page-container">
      <div className="mb-12">
        <p className="stat-label mb-2">Total recaudado</p>
        <p className="font-mono text-3xl sm:text-4xl md:text-6xl font-bold text-ink tracking-tight">
          ${totalMoney.toLocaleString('es-CO')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
        <div className="card">
          <p className="stat-label mb-1">Ventas realizadas</p>
          <p className="stat-number">{totalSales}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-1">Unidades vendidas</p>
          <p className="stat-number">{totalUnits.toLocaleString('es-CO')}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-1">Promedio por venta</p>
          <p className="stat-number">
            ${totalSales > 0 ? Math.round(totalMoney / totalSales).toLocaleString('es-CO') : '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <h3 className="font-display text-xl text-ink mb-4">Más vendidos</h3>
          {topProducts.length > 0 ? (
            <ul className="space-y-3">
              {topProducts.map(([name, count]) => (
                <li key={name} className="flex justify-between items-baseline">
                  <span className="text-ink/80">{name}</span>
                  <span className="font-mono text-sm text-ink/50">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink/30 text-sm">Sin ventas aún</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display text-xl text-ink">Últimas ventas</h3>
            {sales.length > 0 && (
              <Link href="/ventas" className="text-sm text-copper hover:text-copper-dark transition-colors">
                Ver todas
              </Link>
            )}
          </div>
          {recent.length > 0 ? (
            <ul className="divide-y divide-ledger/60">
              {recent.map(sale => (
                <li key={sale.id} className="flex justify-between items-baseline gap-3 py-2.5">
                  <span className="text-ink/80 truncate">
                    {sale.quantity > 1 && <span className="font-mono text-ink/50">{sale.quantity}× </span>}
                    {sale.productName}
                  </span>
                  <span className="font-mono text-sm text-ink/70 shrink-0">
                    ${sale.saleAmount.toLocaleString('es-CO')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink/30 text-sm">Sin ventas aún</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display text-xl text-ink">Inventario</h3>
            <Link href="/productos" className="text-sm text-copper hover:text-copper-dark transition-colors">
              Ver productos
            </Link>
          </div>
          {lowStock.length > 0 ? (
            <ul className="divide-y divide-ledger/60">
              {lowStock.slice(0, 5).map(p => (
                <li key={p.id} className="flex justify-between items-center gap-3 py-2.5">
                  <span className="text-ink/80 truncate">{p.name}</span>
                  <StockBadge stock={p.stock} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink/30 text-sm">Sin alertas de stock</p>
          )}
        </div>
      </div>
    </div>
  )
}
