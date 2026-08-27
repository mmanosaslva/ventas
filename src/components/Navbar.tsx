'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-xl font-bold">
            Ventas
          </Link>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link href="/ventas" className="hover:text-blue-200">
                  Ventas
                </Link>
                <Link href="/ventas/nueva" className="hover:text-blue-200">
                  Nueva Venta
                </Link>
                <span className="text-blue-200">{session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-blue-200">
                  Login
                </Link>
                <Link href="/register" className="hover:text-blue-200">
                  Registro
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}