'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sale } from '@/lib/types'

export default function Home() {
  const { data: session, status } = useSession()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => {
          setSales(data)
          setLoading(false)
        })
    }
  }, [session])

  if (status === 'loading' || loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-4">Sistema de Registro de Ventas</h1>
        <p className="text-gray-600 mb-6">Inicia sesión para ver tus ventas</p>
        <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
          Iniciar Sesión
        </Link>
      </div>
    )
  }

  const totalSales = sales.length
  const totalMoney = sales.reduce((sum, sale) => sum + sale.saleAmount, 0)
  const productSales = sales.reduce((acc, sale) => {
    acc[sale.productName] = (acc[sale.productName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Ventas</h3>
          <p className="text-3xl font-bold">{totalSales}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Dinero Recaudado</h3>
          <p className="text-3xl font-bold">${totalMoney.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Productos Distintos</h3>
          <p className="text-3xl font-bold">{Object.keys(productSales).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
          <ul className="space-y-2">
            {Object.entries(productSales)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([name, count]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span className="font-semibold">{count} vendidos</span>
                </li>
              ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link href="/ventas/nueva" className="block w-full bg-green-600 text-white text-center py-3 rounded hover:bg-green-700">
              Nueva Venta
            </Link>
            <Link href="/ventas" className="block w-full bg-blue-600 text-white text-center py-3 rounded hover:bg-blue-700">
              Ver Todas las Ventas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}