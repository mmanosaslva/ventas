'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Sale } from '@/lib/types'
import Select from '@/components/Select'
import { Field, MoneyField, SearchField } from '@/components/Field'
import {
  BoxIcon,
  CalendarIcon,
  CashIcon,
  ComboIcon,
  HashIcon,
  PencilIcon,
  SortIcon,
  TransferIcon,
  TrashIcon
} from '@/components/icons'

type PayFilter = 'all' | 'efectivo' | 'transferencia'
type KindFilter = 'all' | 'product' | 'combo'

const money = (n: number) => `$${n.toLocaleString('es-CO')}`

const sortOptions = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'amount-desc', label: 'Monto: mayor a menor' },
  { value: 'amount-asc', label: 'Monto: menor a mayor' },
  { value: 'qty-desc', label: 'Cantidad: mayor a menor' },
  { value: 'qty-asc', label: 'Cantidad: menor a mayor' },
  { value: 'name-asc', label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' }
]

interface Row {
  key: string
  name: string
  quantity: number
  amount: number
  count: number // ventas agrupadas en la fila
  sale?: Sale // solo en vista sin agrupar
}

export default function VentasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [comboNames, setComboNames] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null)
  const [editForm, setEditForm] = useState({ productName: '', quantity: '1', saleAmount: '', paymentMethod: 'efectivo' as 'efectivo' | 'transferencia' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [payFilter, setPayFilter] = useState<PayFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [period, setPeriod] = useState('all')
  const [sort, setSort] = useState('recent')
  const [grouped, setGrouped] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session) {
      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => setSales(Array.isArray(data) ? data : []))
      fetch('/api/combos')
        .then(res => res.json())
        .then(data => setComboNames(new Set(Array.isArray(data) ? data.map((c: { name: string }) => c.name) : [])))
        .catch(() => {})
    }
  }, [session, status, router])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-menu-button]') && !target.closest('[data-menu-content]')) {
      setOpenMenu(null)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const isAdmin = session?.user.role === 'admin'

  const filteredSales = useMemo(() => {
    const now = new Date()
    let start: Date | null = null
    if (period === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    else if (period === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1)

    const q = query.trim().toLowerCase()
    return sales.filter(sale => {
      if (payFilter !== 'all' && sale.paymentMethod !== payFilter) return false
      if (kindFilter !== 'all' && comboNames.has(sale.productName) !== (kindFilter === 'combo')) return false
      if (start && new Date(sale.createdAt) < start) return false
      if (q) {
        const haystack = `${sale.productName} ${isAdmin ? sale.user?.email ?? '' : ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [sales, comboNames, payFilter, kindFilter, period, query, isAdmin])

  // Una sola lista: ventas individuales o agrupadas por producto
  const rows = useMemo<Row[]>(() => {
    let list: Row[]
    if (grouped) {
      const map = new Map<string, Row>()
      for (const sale of filteredSales) {
        const row = map.get(sale.productName) ?? { key: sale.productName, name: sale.productName, quantity: 0, amount: 0, count: 0 }
        row.quantity += sale.quantity
        row.amount += sale.saleAmount
        row.count += 1
        map.set(sale.productName, row)
      }
      list = Array.from(map.values())
    } else {
      list = filteredSales.map(sale => ({
        key: String(sale.id),
        name: sale.productName,
        quantity: sale.quantity,
        amount: sale.saleAmount,
        count: 1,
        sale
      }))
    }

    const date = (r: Row) => (r.sale ? new Date(r.sale.createdAt).getTime() : 0)
    const byName = (a: Row, b: Row) => a.name.localeCompare(b.name, 'es')
    switch (sort) {
      case 'oldest': return list.sort((a, b) => date(a) - date(b))
      case 'amount-desc': return list.sort((a, b) => b.amount - a.amount)
      case 'amount-asc': return list.sort((a, b) => a.amount - b.amount)
      case 'qty-desc': return list.sort((a, b) => b.quantity - a.quantity)
      case 'qty-asc': return list.sort((a, b) => a.quantity - b.quantity)
      case 'name-asc': return list.sort(byName)
      case 'name-desc': return list.sort((a, b) => byName(b, a))
      default: return list.sort((a, b) => date(b) - date(a))
    }
  }, [filteredSales, grouped, sort])

  if (status === 'loading' || !session) return null

  const filtering = query.trim() !== '' || payFilter !== 'all' || kindFilter !== 'all' || period !== 'all'
  const totalMoney = filteredSales.reduce((sum, sale) => sum + sale.saleAmount, 0)
  const totalUnits = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0)

  const clearFilters = () => {
    setQuery('')
    setPayFilter('all')
    setKindFilter('all')
    setPeriod('all')
  }

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale)
    setEditForm({
      productName: sale.productName,
      quantity: sale.quantity.toString(),
      saleAmount: sale.saleAmount.toString(),
      paymentMethod: sale.paymentMethod as 'efectivo' | 'transferencia'
    })
    setOpenMenu(null)
    setError('')
  }

  const openDeleteModal = (sale: Sale) => {
    setDeletingSale(sale)
    setOpenMenu(null)
    setError('')
  }

  const handleSaveEdit = async () => {
    if (!editingSale) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/ventas/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
        setLoading(false)
        return
      }

      const updated = await res.json()
      setSales(sales.map(s => s.id === editingSale.id ? updated : s))
      setEditingSale(null)
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  const handleConfirmDelete = async () => {
    if (!deletingSale) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/ventas/${deletingSale.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al eliminar')
        setLoading(false)
        return
      }

      setSales(sales.filter(s => s.id !== deletingSale.id))
      setDeletingSale(null)
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  const toggleMenu = (key: string) => {
    setOpenMenu(openMenu === key ? null : key)
  }

  const MenuDropdown = ({ sale, menuKey }: { sale: Sale; menuKey: string }) => (
    <div className="relative">
      <button
        data-menu-button
        onClick={() => toggleMenu(menuKey)}
        className="icon-btn !w-9 !h-9 text-lg leading-none"
        aria-label="Acciones"
      >
        ⋮
      </button>
      {openMenu === menuKey && (
        <div
          data-menu-content
          className="absolute right-0 top-full mt-1 bg-paper border border-ledger rounded-lg shadow-lg z-10 flex flex-col min-w-[9rem]"
        >
          <button
            onClick={() => openEditModal(sale)}
            className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-ink/80 hover:bg-ledger/50 transition-colors"
          >
            <PencilIcon width={16} height={16} />
            Editar
          </button>
          <button
            onClick={() => openDeleteModal(sale)}
            className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <TrashIcon width={16} height={16} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  )

  const PayBadge = ({ method }: { method: string }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
      {method === 'transferencia' ? <TransferIcon width={13} height={13} /> : <CashIcon width={13} height={13} />}
      {method}
    </span>
  )

  const NameCell = ({ name }: { name: string }) => (
    <span className="inline-flex items-center gap-2 min-w-0">
      {comboNames.has(name)
        ? <ComboIcon width={16} height={16} className="shrink-0 text-copper" />
        : <BoxIcon width={16} height={16} className="shrink-0 text-ink/30" />}
      <span className="truncate">{name}</span>
    </span>
  )

  // Al tocar una fila agrupada se filtra por ese producto
  const drillDown = (name: string) => {
    setQuery(name)
    setGrouped(false)
  }

  const emptyText = filtering ? 'Sin ventas con esos filtros' : 'Sin ventas registradas'

  const payChips = [
    { key: 'all', label: 'Todos', Icon: null },
    { key: 'efectivo', label: 'Efectivo', Icon: CashIcon },
    { key: 'transferencia', label: 'Transferencia', Icon: TransferIcon }
  ] as const
  const kindChips = [
    { key: 'all', label: 'Todo', Icon: null },
    { key: 'product', label: 'Productos', Icon: BoxIcon },
    { key: 'combo', label: 'Combos', Icon: ComboIcon }
  ] as const

  return (
    <div className="page-container">
      <div className="mb-8">
        <div>
          <p className="stat-label mb-2">Ventas{filtering ? ' (filtrado)' : ''}</p>
          <p className="font-mono text-3xl md:text-4xl font-bold text-ink">{money(totalMoney)}</p>
          <p className="text-sm text-ink/40 mt-1 font-mono">
            {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'} · {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="card">
        <div className="space-y-3 mb-5">
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAdmin ? 'Buscar producto, combo o usuario...' : 'Buscar producto o combo...'}
            aria-label="Buscar ventas"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={period} onChange={setPeriod} icon={CalendarIcon} ariaLabel="Periodo" options={[
              { value: 'all', label: 'Todo el tiempo' },
              { value: 'today', label: 'Hoy' },
              { value: '7d', label: 'Últimos 7 días' },
              { value: 'month', label: 'Este mes' }
            ]} />
            <Select value={sort} onChange={setSort} icon={SortIcon} ariaLabel="Ordenar" options={sortOptions} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {payChips.map(({ key, label, Icon }) => (
              <button key={key} type="button" onClick={() => setPayFilter(key)}
                className={`chip ${payFilter === key ? 'chip-active' : ''}`}>
                {Icon && <Icon width={16} height={16} />}
                {label}
              </button>
            ))}
            <span className="hidden sm:block h-5 w-px bg-ledger mx-1" />
            {kindChips.map(({ key, label, Icon }) => (
              <button key={key} type="button" onClick={() => setKindFilter(key)}
                className={`chip ${kindFilter === key ? 'chip-active' : ''}`}>
                {Icon && <Icon width={16} height={16} />}
                {label}
              </button>
            ))}
            <span className="hidden sm:block h-5 w-px bg-ledger mx-1" />
            <button type="button" onClick={() => setGrouped(g => !g)} aria-pressed={grouped}
              className={`chip ${grouped ? 'chip-active' : ''}`}>
              <HashIcon width={16} height={16} />
              Agrupar por producto
            </button>
            {filtering && (
              <button type="button" onClick={clearFilters}
                className="text-sm text-ink/50 hover:text-ink underline ml-1">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="hidden xl:block">
          <table className="w-full">
            <thead>
              <tr>
                {!grouped && <th className="table-header text-left pb-3">Fecha</th>}
                <th className="table-header text-left pb-3">{grouped ? 'Producto / combo' : 'Producto'}</th>
                <th className="table-header text-right pb-3">{grouped ? 'Unidades' : 'Cant.'}</th>
                {grouped && <th className="table-header text-right pb-3">Ventas</th>}
                <th className="table-header text-right pb-3">{grouped ? 'Total' : 'Monto'}</th>
                {!grouped && <th className="table-header text-left pb-3 pl-4">Pago</th>}
                {!grouped && isAdmin && <th className="table-header text-left pb-3">Usuario</th>}
                {!grouped && <th className="table-header text-right pb-3 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className={`table-row ${grouped ? 'cursor-pointer hover:bg-ledger/40' : ''}`}
                  onClick={grouped ? () => drillDown(row.name) : undefined}>
                  {row.sale && (
                    <td className="py-3 text-sm text-ink/50">
                      {new Date(row.sale.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </td>
                  )}
                  <td className="py-3 text-ink/80 max-w-[16rem]"><NameCell name={row.name} /></td>
                  <td className="py-3 text-right font-mono text-sm text-ink/50">{row.quantity}</td>
                  {grouped && <td className="py-3 text-right font-mono text-sm text-ink/50">{row.count}</td>}
                  <td className="py-3 text-right font-mono text-sm text-ink/70">{money(row.amount)}</td>
                  {row.sale && (
                    <>
                      <td className="py-3 pl-4"><PayBadge method={row.sale.paymentMethod} /></td>
                      {isAdmin && <td className="py-3 text-sm text-ink/50">{row.sale.user?.email || '-'}</td>}
                      <td className="py-3 text-right"><MenuDropdown sale={row.sale} menuKey={`sale-${row.sale.id}`} /></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="xl:hidden divide-y divide-ledger/60">
          {rows.map(row => (
            <li key={row.key} className="flex items-start gap-2 py-3"
              onClick={grouped ? () => drillDown(row.name) : undefined}>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-ink/80 font-medium min-w-0">
                    <NameCell name={row.name} />
                  </p>
                  <p className="font-mono text-sm text-ink/70 shrink-0">{money(row.amount)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span className="font-mono text-xs text-ink/50">
                    {row.quantity} {row.quantity === 1 ? 'unidad' : 'unidades'}
                  </span>
                  {row.sale ? (
                    <>
                      <PayBadge method={row.sale.paymentMethod} />
                      <span className="text-xs text-ink/40">
                        {new Date(row.sale.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </span>
                      {isAdmin && row.sale.user?.email && (
                        <span className="text-xs text-ink/40 truncate">{row.sale.user.email}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-ink/40">{row.count} {row.count === 1 ? 'venta' : 'ventas'}</span>
                  )}
                </div>
              </div>
              {row.sale && <MenuDropdown sale={row.sale} menuKey={`m-${row.sale.id}`} />}
            </li>
          ))}
        </ul>

        {rows.length === 0 && (
          <p className="py-8 text-center text-ink/30 text-sm">{emptyText}</p>
        )}
      </div>

      {editingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-4">Editar venta</h3>
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="form-label">Producto</label>
                <Field
                  type="text"
                  icon={BoxIcon}
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  disabled={editingSale.productId != null || editingSale.comboId != null}
                  className="disabled:opacity-60"
                />
                {(editingSale.productId != null || editingSale.comboId != null) && (
                  <p className="text-xs text-ink/40 mt-1">
                    Al cambiar la cantidad se ajusta el inventario automáticamente.
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">Cantidad</label>
                <Field
                  type="number"
                  icon={HashIcon}
                  min="1"
                  inputMode="numeric"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="form-label">Monto</label>
                <MoneyField
                  value={editForm.saleAmount}
                  onChange={(e) => setEditForm({ ...editForm, saleAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Método de pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, paymentMethod: 'efectivo' })}
                    className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      editForm.paymentMethod === 'efectivo'
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
                    onClick={() => setEditForm({ ...editForm, paymentMethod: 'transferencia' })}
                    className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                      editForm.paymentMethod === 'transferencia'
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
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingSale(null)} className="btn-secondary flex-1">
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

      {deletingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-2">Eliminar venta</h3>
            <p className="text-ink/60 mb-6">
              ¿Eliminar <span className="font-medium text-ink">{deletingSale.productName}</span> por ${deletingSale.saleAmount.toLocaleString('es-CO')}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingSale(null)} className="btn-secondary flex-1">
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
