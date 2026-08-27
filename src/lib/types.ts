export interface User {
  id: number
  email: string
  name?: string
}

export interface Sale {
  id: number
  productName: string
  saleAmount: number
  paymentMethod: string
  createdAt: Date
  userId: number
}

export interface SaleFormData {
  productName: string
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