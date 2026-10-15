'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Select from '@/components/Select'
import { Field, MoneyField, SearchField } from '@/components/Field'
import { BoxIcon, PencilIcon, PlusIcon, SortIcon, TagIcon, TrashIcon } from '@/components/icons'
import StockBadge from '@/components/StockBadge'
import { LOW_STOCK } from '@/lib/inventory-shared'

interface Product {
  id: number
  name: string
  price: number | null
  stock: number | null
}

export default function ProductosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [query, setQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState<'all' | 'priced' | 'unpriced' | 'low' | 'out'>('all')
  const [sort, setSort] = useState('name-asc')

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter(p => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (priceFilter === 'low') return p.stock !== null && p.stock > 0 && p.stock <= LOW_STOCK
      if (priceFilter === 'out') return p.stock === 0
      if (priceFilter === 'priced') return p.price !== null
      if (priceFilter === 'unpriced') return p.price === null
      return true
    })
    const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, 'es')
    // Los productos sin precio van al final en los órdenes por precio
    const price = (p: Product, empty: number) => p.price ?? empty
    switch (sort) {
      case 'stock-asc': return list.sort((a, b) => (a.stock ?? Infinity) - (b.stock ?? Infinity) || byName(a, b))
      case 'stock-desc': return list.sort((a, b) => (b.stock ?? -Infinity) - (a.stock ?? -Infinity) || byName(a, b))
      case 'name-desc': return list.sort((a, b) => byName(b, a))
      case 'price-asc': return list.sort((a, b) => price(a, Infinity) - price(b, Infinity) || byName(a, b))
      case 'price-desc': return list.sort((a, b) => price(b, -Infinity) - price(a, -Infinity) || byName(a, b))
      default: return list.sort(byName)
    }
  }, [products, query, priceFilter, sort])

  if (status === 'loading' || !session) {
    return null
  }

  const filtering = query.trim() !== '' || priceFilter !== 'all'

  const parsePrice = (value: string): number | null | undefined => {
    if (value.trim() === '') return null
    const price = parseFloat(value)
    if (isNaN(price) || price < 0) return undefined
    return price
  }

  // '' = sin control de inventario; undefined = inválido
  const parseStockInput = (value: string): number | null | undefined => {
    if (value.trim() === '') return null
    const n = Number(value)
    return Number.isInteger(n) && n >= 0 ? n : undefined
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

    const stock = parseStockInput(formStock)
    if (stock === undefined) {
      setError('El stock debe ser un número entero de 0 en adelante')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, stock })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Error al agregar producto')
        setLoading(false)
        return
      }

      setFormName('')
      setFormPrice('')
      setFormStock('')
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
    setEditStock(product.stock !== null ? String(product.stock) : '')
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

    const stock = parseStockInput(editStock)
    if (stock === undefined) {
      setError('El stock debe ser un número entero de 0 en adelante')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/productos/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, stock })
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
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Productos</h1>
        <p className="page-subtitle">La lista que aparece al registrar una venta</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      <div className="card xl:col-span-2 xl:sticky xl:top-6">
        <h3 className="font-display text-xl text-ink mb-4">Agregar producto</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row xl:flex-col gap-3">
          <div className="flex-1 min-w-0">
            <Field
              type="text"
              icon={TagIcon}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nombre del producto"
              aria-label="Nombre del producto"
            />
          </div>
          <div className="sm:w-40 xl:w-auto">
            <MoneyField
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="Precio (opcional)"
              aria-label="Precio"
            />
          </div>
          <div className="sm:w-36 xl:w-auto">
            <Field
              type="number"
              icon={BoxIcon}
              min="0"
              step="1"
              inputMode="numeric"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
              placeholder="Stock inicial"
              aria-label="Stock inicial"
              className="font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <PlusIcon width={18} height={18} />
            Agregar
          </button>
        </form>
        <p className="text-xs text-ink/40 mt-3">
          El stock es opcional. Si lo dejas vacío, el producto se vende sin control de inventario.
        </p>
      </div>

      <div className="card xl:col-span-3">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-xl text-ink">Lista de productos</h3>
          <span className="text-sm text-ink/40 font-mono">
            {filtering ? `${visible.length} de ${products.length}` : products.length}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
            />
            <Select
              value={sort}
              onChange={setSort}
              icon={SortIcon}
              ariaLabel="Ordenar"
              options={[
                { value: 'name-asc', label: 'Nombre A–Z' },
                { value: 'name-desc', label: 'Nombre Z–A' },
                { value: 'price-asc', label: 'Precio: menor a mayor' },
                { value: 'price-desc', label: 'Precio: mayor a menor' },
                { value: 'stock-asc', label: 'Stock: menor a mayor' },
                { value: 'stock-desc', label: 'Stock: mayor a menor' }
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {([['all', 'Todos'], ['out', 'Agotados'], ['low', 'Stock bajo'], ['priced', 'Con precio'], ['unpriced', 'Sin precio']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPriceFilter(key)}
                className={`chip ${priceFilter === key ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left pb-3">Producto</th>
                <th className="table-header text-right pb-3">Precio</th>
                <th className="table-header text-right pb-3">Stock</th>
                <th className="table-header text-right pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(product => (
                <tr key={product.id} className="table-row">
                  <td className="py-3 text-ink/80">{product.name}</td>
                  <td className="py-3 text-right font-mono text-sm text-ink/70">
                    {product.price !== null ? `$${product.price.toLocaleString('es-CO')}` : '—'}
                  </td>
                  <td className="py-3 text-right"><StockBadge stock={product.stock} /></td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(product)} className="icon-btn" aria-label={`Editar ${product.name}`}>
                      <PencilIcon width={18} height={18} />
                    </button>
                    <button
                      onClick={() => setDeleting(product)}
                      className="icon-btn !text-red-500 hover:!bg-red-50"
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <TrashIcon width={18} height={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="sm:hidden divide-y divide-ledger/60">
          {visible.map(product => (
            <li key={product.id} className="flex items-center gap-2 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-ink/80 truncate">{product.name}</p>
                <p className="font-mono text-sm text-ink/50">
                  {product.price !== null ? `$${product.price.toLocaleString('es-CO')}` : 'Sin precio'}
                </p>
                <div className="mt-1"><StockBadge stock={product.stock} /></div>
              </div>
              <button onClick={() => openEdit(product)} className="icon-btn" aria-label={`Editar ${product.name}`}>
                <PencilIcon width={18} height={18} />
              </button>
              <button
                onClick={() => setDeleting(product)}
                className="icon-btn !text-red-500 hover:!bg-red-50"
                aria-label={`Eliminar ${product.name}`}
              >
                <TrashIcon width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <p className="py-8 text-center text-ink/30 text-sm">
            {filtering ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos. Agrega el primero arriba.'}
          </p>
        )}
      </div>

      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-4">Editar producto</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nombre</label>
                <Field
                  type="text"
                  icon={TagIcon}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Precio (opcional)</label>
                <MoneyField
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Sin precio"
                />
              </div>
              <div>
                <label className="form-label">Stock (vacío = sin control)</label>
                <Field
                  type="number"
                  icon={BoxIcon}
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  placeholder="Sin control"
                  className="font-mono"
                />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
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
