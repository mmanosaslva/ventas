import type { Metadata } from "next"
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import Navbar from "@/components/Navbar"

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Registro de Ventas",
  description: "Sistema de control de ventas",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${dmSerif.variable} ${inter.variable} ${jetbrains.variable} font-body antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-73px)]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}