'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Product {
  id: number
  name: string
  price: number | null
}

export default function NuevaVentaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [saleAmount, setSaleAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/productos')
        .then(res => res.json())
        .then(data => setProducts(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [session])

  if (status === 'loading' || !session) {
    return null
  }

  const isAdding = productId === '__new__'

  const handleProductChange = (value: string) => {
    setProductId(value)
    setError('')
    if (value === '__new__') {
      setNewName('')
      setNewPrice('')
      setSaleAmount('')
      return
    }
    const product = products.find(p => p.id === parseInt(value))
    if (product && product.price !== null) {
      setSaleAmount(String(product.price))
    }
  }

  const handleNewPriceChange = (value: string) => {
    setNewPrice(value)
    if (value !== '') {
      setSaleAmount(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let productName = ''

      if (isAdding) {
        const name = newName.trim()
        if (!name) {
          setError('Escribe el nombre del nuevo producto')
          setLoading(false)
          return
        }

        const price = newPrice.trim() === '' ? null : parseFloat(newPrice)

        const createRes = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, price })
        })

        if (createRes.ok) {
          const created: Product = await createRes.json()
          setProducts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
          productName = created.name
        } else if (createRes.status === 409) {
          const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase())
          if (!existing) {
            setError('Ese producto ya existe en la lista. Selecciónalo desde el desplegable.')
            setLoading(false)
            return
          }
          productName = existing.name
        } else {
          setError('Error al agregar el producto')
          setLoading(false)
          return
        }
      } else {
        const product = products.find(p => p.id === parseInt(productId))
        if (!product) {
          setError('Selecciona un producto')
          setLoading(false)
          return
        }
        productName = product.name
      }

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
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>
                Selecciona un producto
              </option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.price !== null ? ` — $${p.price.toLocaleString('es-CO')}` : ''}
                </option>
              ))}
              <option value="__new__">+ Nuevo producto</option>
            </select>
            {products.length === 0 && (
              <p className="text-xs text-ink/40 mt-2">
                Aún no hay productos en la lista. Elige &quot;+ Nuevo producto&quot; para agregar el primero.
              </p>
            )}
          </div>

          {isAdding && (
            <div className="card !p-4 space-y-3">
              <p className="text-sm font-medium text-ink/60">Nuevo producto</p>
              <div>
                <label className="form-label !mb-1">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-field"
                  placeholder="Camiseta azul"
                />
              </div>
              <div>
                <label className="form-label !mb-1">Precio (opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-ink/30 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => handleNewPriceChange(e.target.value)}
                    className="input-field !pl-8 font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

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
                placeholder="0"
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
