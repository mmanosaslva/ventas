'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NuevaVentaPage() {
  const { status } = useSession()
  const router = useRouter()
  const [productName, setProductName] = useState('')
  const [saleAmount, setSaleAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, saleAmount, paymentMethod })
      })

      if (!res.ok) {
        setError('Error al registrar venta')
        setLoading(false)
        return
      }

      router.push('/ventas')
    } catch {
      setError('Error al conectar con el servidor')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Nueva Venta</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nombre del Producto</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Ej: Camiseta Azul"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Monto de Venta</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Método de Pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'efectivo' | 'transferencia')}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-green-400"
        >
          {loading ? 'Registrando...' : 'Registrar Venta'}
        </button>
      </form>
    </div>
  )
}