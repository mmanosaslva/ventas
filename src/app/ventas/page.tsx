'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sale } from '@/lib/types'

export default function VentasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session) {
      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => {
          setSales(data)
          setLoading(false)
        })
    }
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-ink/30 font-mono text-sm">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const totalMoney = sales.reduce((sum, sale) => sum + sale.saleAmount, 0)
  const productSales = sales.reduce((acc, sale) => {
    if (!acc[sale.productName]) {
      acc[sale.productName] = { count: 0, total: 0 }
    }
    acc[sale.productName].count++
    acc[sale.productName].total += sale.saleAmount
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="stat-label mb-2">Reporte de ventas</p>
          <p className="font-mono text-4xl font-bold text-ink">
            ${totalMoney.toFixed(2)}
          </p>
        </div>
        <Link href="/ventas/nueva" className="btn-primary">
          Nueva venta
        </Link>
      </div>

      <div className="card mb-8">
        <h3 className="font-display text-xl text-ink mb-4">Por producto</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left pb-3">Producto</th>
                <th className="table-header text-right pb-3">Unidades</th>
                <th className="table-header text-right pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(productSales).map(([name, data]) => (
                <tr key={name} className="table-row">
                  <td className="py-3 text-ink/80">{name}</td>
                  <td className="py-3 text-right font-mono text-sm text-ink/50">{data.count}</td>
                  <td className="py-3 text-right font-mono text-sm text-ink/70">${data.total.toFixed(2)}</td>
                </tr>
              ))}
              {Object.keys(productSales).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-ink/30 text-sm">
                    Sin ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display text-xl text-ink mb-4">Historial</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left pb-3">Fecha</th>
                <th className="table-header text-left pb-3">Producto</th>
                <th className="table-header text-right pb-3">Monto</th>
                <th className="table-header text-left pb-3">Pago</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} className="table-row">
                  <td className="py-3 text-sm text-ink/50">
                    {new Date(sale.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 text-ink/80">{sale.productName}</td>
                  <td className="py-3 text-right font-mono text-sm text-ink/70">${sale.saleAmount.toFixed(2)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                      {sale.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink/30 text-sm">
                    Sin ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}