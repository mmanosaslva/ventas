'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Field, MoneyField, SearchField } from '@/components/Field'
import { ComboIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons'

interface Product {
  id: number
  name: string
  price: number | null
}

interface ComboItem {
  id: number
  productId: number
  quantity: number
  product: Product
}

interface Combo {
  id: number
  name: string
  price: number
  items: ComboItem[]
}

const money = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function CombosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Combo | null>(null)
  const [query, setQuery] = useState('')
  const [productQuery, setProductQuery] = useState('')

  // Formulario (crear o editar según editingId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [price, setPrice] = useState('')
  const [priceTouched, setPriceTouched] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const loadAll = () => {
    Promise.all([
      fetch('/api/productos').then(res => res.json()),
      fetch('/api/combos').then(res => res.json())
    ])
      .then(([p, c]) => {
        setProducts(Array.isArray(p) ? p : [])
        setCombos(Array.isArray(c) ? c : [])
      })
      .catch(() => setError('Error al cargar datos'))
  }

  useEffect(() => {
    if (session) {
      loadAll()
    }
  }, [session])

  // Precio estimado = suma de precio × cantidad de los artículos elegidos
  const estimate = products.reduce(
    (sum, p) => sum + (p.price ?? 0) * (selected[p.id] ?? 0),
    0
  )
  const withoutPrice = products.filter(p => selected[p.id] && p.price === null)
  const selectedCount = Object.keys(selected).length
  const totalUnits = Object.values(selected).reduce((a, b) => a + b, 0)

  // Mientras el usuario no edite el precio, sigue el estimado
  useEffect(() => {
    if (!priceTouched) setPrice(selectedCount ? String(estimate) : '')
  }, [estimate, selectedCount, priceTouched])

  const visibleCombos = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return combos
    return combos.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.items.some(i => i.product.name.toLowerCase().includes(q))
    )
  }, [combos, query])

  if (status === 'loading' || !session) {
    return null
  }

  const pq = productQuery.trim().toLowerCase()
  // Los ya elegidos siempre se muestran aunque no coincidan con la búsqueda
  const visibleProducts = pq
    ? products.filter(p => p.name.toLowerCase().includes(pq) || selected[p.id])
    : products

  const toggleProduct = (id: number) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = 1
      return next
    })
  }

  const setQuantity = (id: number, value: string) => {
    const q = parseInt(value)
    setSelected(prev => ({ ...prev, [id]: q > 0 ? q : 1 }))
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setSelected({})
    setPrice('')
    setPriceTouched(false)
  }

  const startEdit = (combo: Combo) => {
    setEditingId(combo.id)
    setName(combo.name)
    setSelected(Object.fromEntries(combo.items.map(i => [i.productId, i.quantity])))
    setPrice(String(combo.price))
    setPriceTouched(true)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Ponle un nombre al combo')
      return
    }
    if (totalUnits < 2) {
      setError('Elige al menos 2 artículos (puedes repetir uno subiendo su cantidad)')
      return
    }
    const finalPrice = parseFloat(price)
    if (isNaN(finalPrice) || finalPrice < 0) {
      setError('El precio no es válido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(editingId ? `/api/combos/${editingId}` : '/api/combos', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: finalPrice,
          items: Object.entries(selected).map(([productId, quantity]) => ({
            productId: Number(productId),
            quantity
          }))
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Error al guardar combo')
        setLoading(false)
        return
      }

      resetForm()
      loadAll()
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
      const res = await fetch(`/api/combos/${deleting.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al eliminar combo')
        setLoading(false)
        return
      }

      if (editingId === deleting.id) resetForm()
      setDeleting(null)
      loadAll()
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Combos</h1>
        <p className="page-subtitle">Arma combos con 2 o más artículos de la lista (puedes repetir uno, ej. dúo)</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      <div className="card xl:col-span-2 xl:sticky xl:top-6">
        <h3 className="font-display text-xl text-ink mb-4">
          {editingId ? 'Editar combo' : 'Nuevo combo'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nombre del combo</label>
            <Field
              type="text"
              icon={ComboIcon}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Combo desayuno"
            />
          </div>

          <div>
            <label className="form-label">Artículos (2 o más unidades; sube la cantidad para repetir)</label>
            {products.length > 6 && (
              <div className="mb-2">
                <SearchField
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar en la lista..."
                  aria-label="Buscar producto para el combo"
                />
              </div>
            )}
            <div className="border border-ledger rounded-lg divide-y divide-ledger/60 max-h-64 overflow-y-auto">
              {visibleProducts.map(p => (
                <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={!!selected[p.id]}
                    onChange={() => toggleProduct(p.id)}
                    id={`p-${p.id}`}
                    className="w-5 h-5 accent-copper"
                  />
                  <label htmlFor={`p-${p.id}`} className="flex-1 min-w-[8rem] text-ink/80 cursor-pointer">
                    {p.name}
                  </label>
                  <span className="font-mono text-sm text-ink/50">
                    {p.price !== null ? money(p.price) : 'sin precio'}
                  </span>
                  {selected[p.id] ? (
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={selected[p.id]}
                      onChange={(e) => setQuantity(p.id, e.target.value)}
                      className="input-field !w-20 !py-1 font-mono"
                      aria-label={`Cantidad de ${p.name}`}
                    />
                  ) : null}
                </div>
              ))}
              {products.length === 0 && (
                <p className="py-6 text-center text-ink/30 text-sm">
                  Primero agrega productos en la página Productos.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Precio del combo</label>
            <MoneyField
              value={price}
              onChange={(e) => { setPrice(e.target.value); setPriceTouched(true) }}
              placeholder="Se estima al elegir artículos"
            />
            <div className="flex flex-wrap items-center justify-between gap-x-3 mt-2 text-xs text-ink/40">
              <span>
                Estimado: <span className="font-mono">{money(estimate)}</span> (suma de precios). Puedes cambiarlo.
              </span>
              {priceTouched && (
                <button
                  type="button"
                  onClick={() => setPriceTouched(false)}
                  className="text-ink/60 hover:text-ink underline"
                >
                  Usar estimado
                </button>
              )}
            </div>
            {withoutPrice.length > 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Sin precio (cuentan $0): {withoutPrice.map(p => p.name).join(', ')}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 inline-flex items-center justify-center gap-2 flex-1 sm:flex-none">
              {!loading && !editingId && <PlusIcon width={18} height={18} />}
              {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear combo'}
            </button>
          </div>
        </form>
      </div>

      <div className="card xl:col-span-3">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-xl text-ink">Lista de combos</h3>
          <span className="text-sm text-ink/40 font-mono">
            {query.trim() ? `${visibleCombos.length} de ${combos.length}` : combos.length}
          </span>
        </div>

        <div className="mb-5">
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar combo o artículo..."
            aria-label="Buscar combo"
          />
        </div>

        <ul className="divide-y divide-ledger/60">
          {visibleCombos.map(combo => (
            <li key={combo.id} className="flex items-start gap-2 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-ink/80 font-medium truncate">{combo.name}</p>
                  <p className="font-mono text-sm text-ink/70 shrink-0">{money(combo.price)}</p>
                </div>
                <p className="text-sm text-ink/50 mt-0.5">
                  {combo.items
                    .map(i => (i.quantity > 1 ? `${i.quantity}× ${i.product.name}` : i.product.name))
                    .join(', ')}
                </p>
              </div>
              <button onClick={() => startEdit(combo)} className="icon-btn" aria-label={`Editar ${combo.name}`}>
                <PencilIcon width={18} height={18} />
              </button>
              <button
                onClick={() => setDeleting(combo)}
                className="icon-btn !text-red-500 hover:!bg-red-50"
                aria-label={`Eliminar ${combo.name}`}
              >
                <TrashIcon width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>

        {visibleCombos.length === 0 && (
          <p className="py-8 text-center text-ink/30 text-sm">
            {query.trim() ? 'Ningún combo coincide con la búsqueda.' : 'Aún no hay combos. Crea el primero arriba.'}
          </p>
        )}
      </div>

      </div>

      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-2">Eliminar combo</h3>
            <p className="text-ink/60 mb-6">
              ¿Eliminar <span className="font-medium text-ink">{deleting.name}</span>?
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
