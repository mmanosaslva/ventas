'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NuevaVentaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [productName, setProductName] = useState('')
  const [saleAmount, setSaleAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || !session) {
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

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-ink mb-2">Nueva venta</h1>
          <p className="text-ink/40">Registra lo que vendiste</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="form-label">Producto</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="input-field"
              placeholder="Camiseta azul"
              required
            />
          </div>

          <div>
            <label className="form-label">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-ink/30 font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className="input-field !pl-8 font-mono"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Método de pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  paymentMethod === 'efectivo'
                    ? 'border-copper bg-copper/10 text-copper'
                    : 'border-ledger text-ink/50 hover:border-ink/20'
                }`}
              >
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'border-copper bg-copper/10 text-copper'
                    : 'border-ledger text-ink/50 hover:border-ink/20'
                }`}
              >
                Transferencia
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar venta'}
          </button>
        </form>
      </div>
    </div>
  )
}
