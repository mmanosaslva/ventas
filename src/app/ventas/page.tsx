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
    return <div className="text-center py-8">Cargando...</div>
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
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reporte de Ventas</h1>
        <Link href="/ventas/nueva" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Nueva Venta
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Dinero Recaudado</h3>
          <p className="text-3xl font-bold">${totalMoney.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Ventas Realizadas</h3>
          <p className="text-3xl font-bold">{sales.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Ventas por Producto</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Producto</th>
                <th className="text-right py-2">Vendidos</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(productSales).map(([name, data]) => (
                <tr key={name} className="border-b">
                  <td className="py-2">{name}</td>
                  <td className="text-right py-2">{data.count}</td>
                  <td className="text-right py-2">${data.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detalle de Ventas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Producto</th>
                <th className="text-right py-2">Monto</th>
                <th className="text-left py-2">Pago</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} className="border-b">
                  <td className="py-2">{new Date(sale.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">{sale.productName}</td>
                  <td className="text-right py-2">${sale.saleAmount.toFixed(2)}</td>
                  <td className="py-2 capitalize">{sale.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}