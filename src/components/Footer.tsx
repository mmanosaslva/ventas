'use client'

import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/plataforma50_logo.png"
            alt="Plataforma50"
            width={100}
            height={30}
            className="brightness-0 invert opacity-80"
          />

          <div className="flex items-center gap-4 text-sm text-paper/50">
            <span>Barranquilla, Colombia</span>
            <span className="text-paper/20">·</span>
            <a
              href="https://plataforma50.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-paper transition-colors"
            >
              Nosotros
            </a>
            <span className="text-paper/20">·</span>
            <span>&copy; {new Date().getFullYear()} Plataforma50</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
