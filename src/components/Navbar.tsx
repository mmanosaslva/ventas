'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-[73px]">
          <Link href="/" className="font-display text-2xl tracking-tight shrink-0">
            Inventario
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-paper/70 hover:text-paper p-2"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {session ? (
            <div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto absolute sm:static top-[73px] left-0 right-0 bg-ink sm:bg-transparent px-6 sm:px-0 py-4 sm:py-0 z-20`}>
              <Link href="/ventas" className="btn-primary text-sm !px-4 !py-2" onClick={() => setMenuOpen(false)}>
                Ventas
              </Link>
              <Link href="/ventas/nueva" className="btn-primary text-sm !px-4 !py-2" onClick={() => setMenuOpen(false)}>
                Nueva Venta
              </Link>
              <div className="hidden sm:block h-6 w-px bg-paper/20 mx-1" />
              <span className="text-sm text-paper/50">{session.user?.email}</span>
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="text-sm text-paper/50 hover:text-paper transition-colors sm:ml-1"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto absolute sm:static top-[73px] left-0 right-0 bg-ink sm:bg-transparent px-6 sm:px-0 py-4 sm:py-0 z-20`}>
              <Link href="/login" className="btn-primary text-sm !px-4 !py-2" onClick={() => setMenuOpen(false)}>
                Entrar
              </Link>
              <Link href="/register" className="btn-primary text-sm !px-4 !py-2" onClick={() => setMenuOpen(false)}>
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
