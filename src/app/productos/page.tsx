'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Product {
  id: number
  name: string
  price: number | null
}

export default function ProductosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [deleting, setDeleting] = useState<Product | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const loadProducts = () => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar productos'))
  }

  useEffect(() => {
    if (session) {
      loadProducts()
    }
  }, [session])

  if (status === 'loading' || !session) {
    return null
  }

  const parsePrice = (value: string): number | null | undefined => {
    if (value.trim() === '') return null
    const price = parseFloat(value)
    if (isNaN(price) || price < 0) return undefined
    return price
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const name = formName.trim()
    if (!name) {
      setError('Escribe el nombre del producto')
      return
    }

    const price = parsePrice(formPrice)
    if (price === undefined) {
      setError('El precio no es válido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Error al agregar producto')
        setLoading(false)
        return
      }

      setFormName('')
      setFormPrice('')
      loadProducts()
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setEditName(product.name)
    setEditPrice(product.price !== null ? String(product.price) : '')
    setError('')
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setError('')

    const name = editName.trim()
    if (!name) {
      setError('El nombre no puede estar vacío')
      return
    }

    const price = parsePrice(editPrice)
    if (price === undefined) {
      setError('El precio no es válido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/productos/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Error al guardar cambios')
        setLoading(false)
        return
      }

      setEditing(null)
      loadProducts()
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/productos/${deleting.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al eliminar producto')
        setLoading(false)
        return
      }

      setDeleting(null)
      loadProducts()
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-ink mb-2">Productos</h1>
        <p className="text-ink/40">La lista que aparece al registrar una venta</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="card mb-8">
        <h3 className="font-display text-xl text-ink mb-4">Agregar producto</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="input-field flex-1"
            placeholder="Nombre del producto"
          />
          <div className="relative sm:w-48">
            <span className="absolute left-4 top-3 text-ink/30 font-mono">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              className="input-field !pl-8 font-mono"
              placeholder="Precio (opcional)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            Agregar
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-display text-xl text-ink mb-4">Lista de productos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left pb-3">Producto</th>
                <th className="table-header text-right pb-3">Precio</th>
                <th className="table-header text-right pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="table-row">
                  <td className="py-3 text-ink/80">{product.name}</td>
                  <td className="py-3 text-right font-mono text-sm text-ink/70">
                    {product.price !== null ? `$${product.price.toLocaleString('es-CO')}` : '—'}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(product)}
                      className="text-sm text-ink/50 hover:text-ink transition-colors"
                    >
                      Editar
                    </button>
                    <span className="mx-2 text-ink/20">|</span>
                    <button
                      onClick={() => setDeleting(product)}
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-ink/30 text-sm">
                    Aún no hay productos. Agrega el primero arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-4">Editar producto</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Precio (opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-ink/30 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="input-field !pl-8 font-mono"
                    placeholder="Sin precio"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-2">Eliminar producto</h3>
            <p className="text-ink/60 mb-6">
              ¿Eliminar <span className="font-medium text-ink">{deleting.name}</span> de la lista?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
