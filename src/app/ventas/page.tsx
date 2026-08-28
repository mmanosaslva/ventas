'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Sale } from '@/lib/types'

export default function VentasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null)
  const [editForm, setEditForm] = useState({ productName: '', quantity: '1', saleAmount: '', paymentMethod: 'efectivo' as 'efectivo' | 'transferencia' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session) {
      fetch('/api/ventas')
        .then(res => res.json())
        .then(data => setSales(data))
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

  if (status === 'loading' || !session) return null

  const isAdmin = session.user.role === 'admin'
  const totalMoney = sales.reduce((sum, sale) => sum + sale.saleAmount, 0)
  const productSales = sales.reduce((acc, sale) => {
    if (!acc[sale.productName]) {
      acc[sale.productName] = { count: 0, total: 0, saleIds: [] }
    }
    acc[sale.productName].count += sale.quantity
    acc[sale.productName].total += sale.saleAmount
    acc[sale.productName].saleIds.push(sale.id)
    return acc
  }, {} as Record<string, { count: number; total: number; saleIds: number[] }>)

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
        className="text-ink/40 hover:text-ink/70 p-1 transition-colors"
      >
        ⋮
      </button>
      {openMenu === menuKey && (
        <div
          data-menu-content
          className="absolute right-0 top-full mt-1 bg-paper border border-ledger rounded-lg shadow-lg z-10 flex flex-col"
        >
          <button
            onClick={() => openEditModal(sale)}
            className="px-4 py-2 text-left text-sm text-ink/80 hover:bg-ledger/50 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => openDeleteModal(sale)}
            className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="stat-label mb-2">Reporte de ventas</p>
        <p className="font-mono text-2xl md:text-4xl font-bold text-ink">
          ${totalMoney.toLocaleString('es-CO')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="card mb-8">
        <h3 className="font-display text-xl text-ink mb-4">Por producto</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left pb-3">Producto</th>
                <th className="table-header text-right pb-3">Unidades</th>
                <th className="table-header text-right pb-3">Total</th>
                <th className="table-header text-right pb-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(productSales).map(([name, data]) => {
                const firstSale = sales.find(s => s.id === data.saleIds[0])
                if (!firstSale) return null
                return (
                  <tr key={name} className="table-row">
                    <td className="py-3 text-ink/80">{name}</td>
                    <td className="py-3 text-right font-mono text-sm text-ink/50">{data.count}</td>
                    <td className="py-3 text-right font-mono text-sm text-ink/70">${data.total.toLocaleString('es-CO')}</td>
                    <td className="py-3 text-right">
                      <MenuDropdown sale={firstSale} menuKey={`product-${name}`} />
                    </td>
                  </tr>
                )
              })}
              {Object.keys(productSales).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink/30 text-sm">
                    Sin ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display text-xl text-ink mb-4">Historial</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left pb-3">Fecha</th>
                <th className="table-header text-left pb-3">Producto</th>
                <th className="table-header text-right pb-3">Monto</th>
                <th className="table-header text-left pb-3">Pago</th>
                {isAdmin && <th className="table-header text-left pb-3">Usuario</th>}
                <th className="table-header text-right pb-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id} className="table-row">
                  <td className="py-3 text-sm text-ink/50">
                    {new Date(sale.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 text-ink/80">{sale.productName}</td>
                  <td className="py-3 text-right font-mono text-sm text-ink/70">${sale.saleAmount.toLocaleString('es-CO')}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 text-sm text-ink/50">{sale.user?.email || '-'}</td>
                  )}
                  <td className="py-3 text-right">
                    <MenuDropdown sale={sale} menuKey={`sale-${sale.id}`} />
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-ink/30 text-sm">
                    Sin ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-paper rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-display text-xl text-ink mb-4">Editar venta</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Producto</label>
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  className="input-field font-mono"
                />
              </div>
              <div>
                <label className="form-label">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-ink/30 font-mono">$</span>
                  <input
                    type="number"
                    value={editForm.saleAmount}
                    onChange={(e) => setEditForm({ ...editForm, saleAmount: e.target.value })}
                    className="input-field !pl-8 font-mono"
                  />
                </div>
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
                    Efectivo
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
                    Transferencia
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
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
