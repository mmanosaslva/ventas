export interface User {
  id: number
  email: string
  name?: string
}

export interface Sale {
  id: number
  productName: string
  quantity: number
  saleAmount: number
  paymentMethod: string
  createdAt: Date
  userId: number
  user?: { email: string; name: string | null }
}

export interface SaleFormData {
  productName: string
  quantity: number
  saleAmount: number
  paymentMethod: 'efectivo' | 'transferencia'
}

export interface SalesReport {
  totalSales: number
  totalMoney: number
  productSales: {
    productName: string
    count: number
    total: number
  }[]
}