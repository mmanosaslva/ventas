'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sale } from '@/lib/types'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session) {
      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => setSales(data))
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return null
  }

  const totalSales = sales.length
  const totalMoney = sales.reduce((sum, sale) => sum + sale.saleAmount, 0)
  const productSales = sales.reduce((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="stat-label mb-2">Total recaudado</p>
        <p className="font-mono text-6xl font-bold text-ink tracking-tight">
          ${totalMoney.toLocaleString('es-CO')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card">
          <p className="stat-label mb-1">Ventas realizadas</p>
          <p className="stat-number">{totalSales}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-1">Productos distintos</p>
          <p className="stat-number">{Object.keys(productSales).length}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-1">Promedio por venta</p>
          <p className="stat-number">
            ${totalSales > 0 ? Math.round(totalMoney / totalSales).toLocaleString('es-CO') : '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <h3 className="font-display text-xl text-ink mb-4">Acciones</h3>
          <div className="space-y-3">
            <Link href="/ventas/nueva" className="btn-primary block text-center">
              Registrar venta
            </Link>
            <Link href="/ventas" className="btn-secondary block text-center">
              Ver reporte completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
