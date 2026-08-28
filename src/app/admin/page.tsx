'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: number
  email: string
  name: string | null
  role: string
  createdAt: string
  _count: { sales: number }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'user' })
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session && session.user.role !== 'admin') router.push('/')
    if (session && session.user.role === 'admin') {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => { setUsers(data); setLoading(false) })
    }
  }, [session, status, router])

  if (status === 'loading' || !session || session.user.role !== 'admin') return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        setCreating(false)
        return
      }

      setUsers([{ ...data.user, _count: { sales: 0 } }, ...users])
      setForm({ email: '', password: '', name: '', role: 'user' })
    } catch {
      setError('Error de conexión')
    }
    setCreating(false)
  }

  const handleDelete = async (userId: number) => {
    setDeletingId(userId)
    setError('')

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        setDeletingId(null)
        return
      }

      setUsers(users.filter(u => u.id !== userId))
    } catch {
      setError('Error de conexión')
    }
    setDeletingId(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="stat-label mb-2">Panel de administración</p>
        <p className="font-mono text-2xl md:text-4xl font-bold text-ink">Gestión de usuarios</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
          {error}
        </div>
      )}

      <div className="card mb-8">
        <h3 className="font-display text-xl text-ink mb-4">Crear usuario</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="email@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="form-label">Rol</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'user' })}
                  className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                    form.role === 'user'
                      ? 'border-copper bg-copper/10 text-copper'
                      : 'border-ledger text-ink/50 hover:border-ink/20'
                  }`}
                >
                  Usuario
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'admin' })}
                  className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                    form.role === 'admin'
                      ? 'border-copper bg-copper/10 text-copper'
                      : 'border-ledger text-ink/50 hover:border-ink/20'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn-primary disabled:opacity-50"
          >
            {creating ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-display text-xl text-ink mb-4">Usuarios ({users.length})</h3>
        {loading ? (
          <p className="text-ink/30 text-sm">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-ink/30 text-sm">Sin usuarios registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left pb-3">Nombre</th>
                  <th className="table-header text-left pb-3">Email</th>
                  <th className="table-header text-left pb-3">Rol</th>
                  <th className="table-header text-right pb-3">Ventas</th>
                  <th className="table-header text-right pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="table-row">
                    <td className="py-3 text-ink/80">{user.name || '-'}</td>
                    <td className="py-3 text-ink/60 text-sm">{user.email}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-copper/10 text-copper' : 'bg-ink/5 text-ink/60'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-ink/50">{user._count.sales}</td>
                    <td className="py-3 text-right">
                      {user.id !== parseInt(session.user.id) && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="text-red-500 hover:text-red-700 text-sm transition-colors disabled:opacity-50"
                        >
                          {deletingId === user.id ? '...' : 'Eliminar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
