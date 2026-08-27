'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-[73px]">
          <Link href="/" className="font-display text-2xl tracking-tight shrink-0">
            Inventario
          </Link>

          {session ? (
            <div className="flex items-center gap-3 ml-auto">
              <Link href="/ventas" className="btn-primary text-sm !px-4 !py-2">
                Inventario
              </Link>
              <Link href="/ventas/nueva" className="btn-primary text-sm !px-4 !py-2">
                Nueva Venta
              </Link>
              <div className="h-6 w-px bg-paper/20 mx-1" />
              <span className="text-sm text-paper/50">{session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-paper/50 hover:text-paper transition-colors ml-1"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-auto">
              <Link href="/login" className="btn-primary text-sm !px-4 !py-2">
                Entrar
              </Link>
              <Link href="/register" className="btn-primary text-sm !px-4 !py-2">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
