'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-[73px]">
          <Link href="/" className="font-display text-2xl tracking-tight">
            Ventas
          </Link>

          <div className="flex items-center gap-6">
            {session ? (
              <>
                <Link href="/ventas" className="text-sm font-medium text-paper/70 hover:text-paper transition-colors">
                  Reporte
                </Link>
                <Link href="/ventas/nueva" className="btn-primary text-sm !px-4 !py-2">
                  Nueva Venta
                </Link>
                <div className="h-6 w-px bg-paper/20" />
                <span className="text-sm text-paper/50">{session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-paper/50 hover:text-paper transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-paper/70 hover:text-paper transition-colors">
                  Entrar
                </Link>
                <Link href="/register" className="btn-primary text-sm !px-4 !py-2">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}