import { LOW_STOCK } from '@/lib/inventory-shared'

// Estado visual del inventario de un producto (null = sin control)
export default function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) {
    return <span className="text-xs text-ink/30">Sin control</span>
  }
  const tone =
    stock === 0
      ? 'bg-red-50 text-red-700'
      : stock <= LOW_STOCK
        ? 'bg-amber-50 text-amber-700'
        : 'bg-success/10 text-success'
  const label = stock === 0 ? 'Agotado' : stock <= LOW_STOCK ? `Bajo: ${stock}` : `${stock} disp.`
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${tone}`}>
      {label}
    </span>
  )
}
