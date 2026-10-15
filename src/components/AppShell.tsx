'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Footer from './Footer'
import {
  BoxIcon,
  CloseIcon,
  ComboIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldIcon,
  UserIcon
} from './icons'

const links = [
  { href: '/', label: 'Inicio', icon: HomeIcon },
  { href: '/ventas', label: 'Ventas', icon: ReceiptIcon },
  { href: '/productos', label: 'Productos', icon: BoxIcon },
  { href: '/combos', label: 'Combos', icon: ComboIcon }
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded brightness-0 invert" />
      <span className="font-display text-2xl tracking-tight">Inventario</span>
    </Link>
  )
}

// Sidebar fija en pantallas grandes (lg+); en tablets y móviles es un panel deslizable
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-ink text-paper">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <Brand />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    )
  }

  const items = isAdmin ? [...links, { href: '/admin', label: 'Admin', icon: ShieldIcon }] : links
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const current =
    pathname.startsWith('/ventas/nueva') ? 'Nueva venta' : items.find(i => isActive(i.href))?.label ?? ''

  const nav = (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) && !pathname.startsWith('/ventas/nueva') ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
            isActive(href) && !pathname.startsWith('/ventas/nueva')
              ? 'bg-paper/10 text-paper'
              : 'text-paper/60 hover:text-paper hover:bg-paper/5'
          }`}
        >
          <Icon width={20} height={20} />
          {label}
        </Link>
      ))}
    </nav>
  )

  const userBlock = (
    <div className="border-t border-paper/10 pt-4 flex items-center gap-3">
      <span className="w-9 h-9 rounded-full bg-paper/10 flex items-center justify-center shrink-0">
        <UserIcon width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{session.user?.name || session.user?.email}</p>
        <p className="text-xs text-paper/40">{isAdmin ? 'Administrador' : 'Usuario'}</p>
      </div>
      <button
        onClick={() => signOut()}
        className="icon-btn !text-paper/50 hover:!text-paper hover:!bg-paper/10"
        aria-label="Salir"
        title="Salir"
      >
        <LogoutIcon />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar de escritorio */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col gap-6 bg-ink text-paper p-4 z-40">
        <div className="h-12 flex items-center px-1">
          <Brand />
        </div>
        <Link href="/ventas/nueva" className="btn-primary flex items-center justify-center gap-2">
          <PlusIcon width={18} height={18} />
          Nueva venta
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {userBlock}
      </aside>

      {/* Barra superior en tablets y móviles */}
      <header className="lg:hidden sticky top-0 z-30 bg-ink text-paper">
        <div className="h-16 px-4 sm:px-6 flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="icon-btn !text-paper/80 hover:!text-paper hover:!bg-paper/10 -ml-2"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <MenuIcon />
          </button>
          <p className="flex-1 font-display text-xl truncate">{current}</p>
          <Link
            href="/ventas/nueva"
            className="btn-primary !px-3 !py-2 flex items-center gap-1.5 text-sm"
            aria-label="Nueva venta"
          >
            <PlusIcon width={18} height={18} />
            <span className="hidden sm:inline">Nueva venta</span>
          </Link>
        </div>
      </header>

      {/* Panel deslizable */}
      <div className={`lg:hidden fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-ink text-paper p-4 flex flex-col gap-6 transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-12 flex items-center justify-between px-1">
            <Brand />
            <button
              onClick={() => setOpen(false)}
              className="icon-btn !text-paper/70 hover:!text-paper hover:!bg-paper/10"
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          {userBlock}
        </aside>
      </div>

      <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:min-h-screen">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
