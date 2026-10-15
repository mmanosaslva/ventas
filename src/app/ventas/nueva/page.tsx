'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Select, { SelectOption } from '@/components/Select'
import { Field, MoneyField } from '@/components/Field'
import { TransferIcon, BoxIcon, CashIcon, ComboIcon, HashIcon, TagIcon } from '@/components/icons'

interface Product {
  id: number
  name: string
  price: number | null
  stock: number | null
}

interface Combo {
  id: number
  name: string
  price: number
  items: { quantity: number; product: Product }[]
}

// Unidades vendibles de un combo según el stock de sus artículos (null = sin límite)
const comboAvailable = (combo: Combo): number | null => {
  const limits = combo.items
    .filter(i => i.product.stock !== null)
    .map(i => Math.floor((i.product.stock as number) / i.quantity))
  return limits.length ? Math.min(...limits) : null
}

const stockHint = (available: number | null) =>
  available === null ? '' : available === 0 ? 'Agotado' : `${available} disp.`

export default function NuevaVentaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  // 'p:<id>' producto, 'c:<id>' combo, '__new__' producto nuevo
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saleAmount, setSaleAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newStock, setNewStock] = useState('')
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
      fetch('/api/combos')
        .then(res => res.json())
        .then(data => setCombos(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [session])

  if (status === 'loading' || !session) {
    return null
  }

  const isAdding = productId === '__new__'
  const parsedQty = parseInt(quantity)
  const qty = isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty
  const selectedCombo = productId.startsWith('c:')
    ? combos.find(c => c.id === parseInt(productId.slice(2)))
    : undefined
  const selectedProduct = productId.startsWith('p:')
    ? products.find(p => p.id === parseInt(productId.slice(2)))
    : undefined
  // El combo siempre tiene precio; un producto puede no tenerlo
  const available: number | null = selectedCombo
    ? comboAvailable(selectedCombo)
    : (selectedProduct?.stock ?? null)
  const overStock = available !== null && qty > available
  const selectedUnitPrice = selectedCombo ? selectedCombo.price : (selectedProduct?.price ?? null)
  const unitPrice = isAdding
    ? (newPrice.trim() === '' ? null : parseFloat(newPrice))
    : selectedUnitPrice

  const optionHint = (price: number | null, available: number | null) =>
    [price !== null ? `$${price.toLocaleString('es-CO')}` : '', stockHint(available)]
      .filter(Boolean)
      .join(' · ')

  const productOptions: SelectOption[] = [
    ...products.map(p => ({
      value: `p:${p.id}`,
      label: p.name,
      hint: optionHint(p.price, p.stock) || undefined,
      group: 'Productos',
      disabled: p.stock === 0
    })),
    ...combos.map(c => {
      const available = comboAvailable(c)
      return {
        value: `c:${c.id}`,
        label: c.name,
        hint: optionHint(c.price, available),
        group: 'Combos',
        disabled: available === 0
      }
    }),
    { value: '__new__', label: '+ Nuevo producto', group: 'Otro' }
  ]
  const hasPrice = unitPrice !== null && !isNaN(unitPrice)
  const computedTotal = hasPrice ? unitPrice * qty : null
  const effectiveAmount = computedTotal !== null ? String(computedTotal) : saleAmount

  const updateAmountForPrice = (price: number | null, q: number) => {
    if (price !== null && !isNaN(price)) {
      setSaleAmount(String(price * q))
    } else {
      setSaleAmount('')
    }
  }

  const handleProductChange = (value: string) => {
    setProductId(value)
    setError('')
    if (value === '__new__') {
      setNewName('')
      setNewPrice('')
      return
    }
    const combo = value.startsWith('c:') ? combos.find(c => c.id === parseInt(value.slice(2))) : undefined
    const product = value.startsWith('p:') ? products.find(p => p.id === parseInt(value.slice(2))) : undefined
    updateAmountForPrice(combo ? combo.price : (product?.price ?? null), qty)
  }

  const handleNewPriceChange = (value: string) => {
    setNewPrice(value)
    if (value.trim() !== '') {
      const price = parseFloat(value)
      if (!isNaN(price)) {
        setSaleAmount(String(price * qty))
      }
    } else {
      setSaleAmount('')
    }
  }

  const handleQuantityChange = (value: string) => {
    const parsed = parseInt(value)
    const q = isNaN(parsed) || parsed < 1 ? 1 : parsed
    setQuantity(value)
    if (isAdding) {
      if (newPrice.trim() !== '') {
        const price = parseFloat(newPrice)
        if (!isNaN(price)) {
          setSaleAmount(String(price * q))
        }
      }
    } else if (selectedUnitPrice !== null) {
      setSaleAmount(String(selectedUnitPrice * q))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let productName = ''
      let saleProductId: number | null = null

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
          body: JSON.stringify({ name, price, stock: newStock.trim() === '' ? null : newStock })
        })

        if (createRes.ok) {
          const created: Product = await createRes.json()
          setProducts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
          productName = created.name
          saleProductId = created.id
        } else if (createRes.status === 409) {
          const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase())
          if (!existing) {
            setError('Ese producto ya existe en la lista. Selecciónalo desde el desplegable.')
            setLoading(false)
            return
          }
          productName = existing.name
          saleProductId = existing.id
        } else {
          const data = await createRes.json().catch(() => ({}))
          setError(data.error || 'Error al agregar el producto')
          setLoading(false)
          return
        }
      } else {
        const item = selectedCombo ?? selectedProduct
        if (!item) {
          setError('Selecciona un producto o combo')
          setLoading(false)
          return
        }
        productName = item.name
      }

      if (overStock) {
        setError(`Solo hay ${available} disponible${available === 1 ? '' : 's'}`)
        setLoading(false)
        return
      }

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productId: saleProductId ?? selectedProduct?.id ?? null,
          comboId: selectedCombo?.id ?? null,
          quantity: qty,
          saleAmount: effectiveAmount,
          paymentMethod
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al registrar venta')
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
    <div className="flex justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="page-title">Nueva venta</h1>
          <p className="page-subtitle">Registra lo que vendiste</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="form-label">Producto o combo</label>
            <Select
              value={productId}
              onChange={handleProductChange}
              options={productOptions}
              placeholder="Selecciona"
              icon={selectedCombo ? ComboIcon : BoxIcon}
              ariaLabel="Producto o combo"
            />
            {available !== null && (
              <p className={`text-xs mt-2 font-mono ${overStock ? 'text-red-600' : 'text-ink/40'}`}>
                {overStock
                  ? `Solo hay ${available} disponible${available === 1 ? '' : 's'}`
                  : `${available} disponible${available === 1 ? '' : 's'} en inventario`}
              </p>
            )}
            {products.length === 0 && combos.length === 0 && (
              <p className="text-xs text-ink/40 mt-2">
                Elige &quot;+ Nuevo producto&quot; para agregar el primero.
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Cantidad</label>
            <Field
              type="number"
              icon={HashIcon}
              min="1"
              max={available ?? undefined}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="font-mono"
            />
          </div>

          {isAdding && (
            <div className="card !p-4 space-y-3">
              <p className="text-sm font-medium text-ink/60">Nuevo producto</p>
              <div>
                <label className="form-label !mb-1">Nombre</label>
                <Field
                  type="text"
                  icon={TagIcon}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Camiseta azul"
                />
              </div>
              <div>
                <label className="form-label !mb-1">Precio (opcional)</label>
                <MoneyField
                  value={newPrice}
                  onChange={(e) => handleNewPriceChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="form-label !mb-1">Stock inicial (opcional)</label>
                <Field
                  type="number"
                  icon={BoxIcon}
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Sin control de inventario"
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Monto a pagar</label>
            <MoneyField
              value={effectiveAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              readOnly={hasPrice}
              className={hasPrice ? 'opacity-70' : ''}
              placeholder="0"
              required
            />
            {hasPrice && (
              <p className="text-xs text-ink/40 mt-2 font-mono">
                ${unitPrice.toLocaleString('es-CO')} × {qty}
              </p>
            )}
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
                <span className="inline-flex items-center justify-center gap-2">
                  <CashIcon width={18} height={18} />
                  Efectivo
                </span>
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
                <span className="inline-flex items-center justify-center gap-2">
                  <TransferIcon width={18} height={18} />
                  Transferencia
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || overStock}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar venta'}
          </button>
        </form>
      </div>
    </div>
  )
}