

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Rojo - S" or "Grande"
  price: number;
  stock: number;
  barcode?: string;
  cost?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode?: string;
  description?: string;
  cost?: number; // Cost price for profit calculation
  image?: string;
  // Variants Support
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
  discount?: number; // Amount to subtract per unit
  // Variant specifics in Cart
  selectedVariantId?: string;
  selectedVariantName?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'yape' | 'plin';

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  dni?: string;
  email?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod; // Primary method or 'mixed'
  payments?: PaymentDetail[]; // Detailed breakdown for split payments
  customerId?: string;
  customerName?: string;
  profit: number; // Calculated at time of sale
  shiftId?: string; // Link to the cash shift
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  invoiceNumber: string;
  items: PurchaseItem[];
  totalCost: number;
}

export interface Supplier {
  id: string;
  name: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactName?: string;
}

export enum ViewState {
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  PURCHASES = 'PURCHASES',
  SALES = 'SALES',
  CUSTOMERS = 'CUSTOMERS',
  SETTINGS = 'SETTINGS',
  ADMIN = 'ADMIN' // New View for Super Admin
}

export interface StoreSettings {
  storeName: string;
  ruc: string;
  address: string;
  phone: string;
  taxRate: number; // Percentage, e.g., 0.16 for 16%
  currency: string;
  pricesIncludeTax: boolean; // Determines if tax is added on top or extracted
  logo?: string; // Optional logo base64 string
}

export interface Stats {
  totalSales: number;
  totalTransactions: number;
  topSellingProduct: string;
}

// --- Cash Management Types ---

export type CashMovementType = 'OPEN' | 'CLOSE' | 'IN' | 'OUT';

export interface CashMovement {
  id: string;
  shiftId: string;
  type: CashMovementType;
  amount: number;
  description: string;
  timestamp: string;
}

export interface CashShift {
  id: string;
  startTime: string;
  endTime?: string;
  startAmount: number;
  endAmount?: number; // Counted cash
  expectedAmount?: number; // Calculated cash
  status: 'OPEN' | 'CLOSED';
  totalSalesCash: number;
  totalSalesDigital: number;
}

// --- SaaS / Auth Types ---

export type UserRole = 'owner' | 'employee' | 'admin';
export type PlanType = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  phone: string;
  storeName: string;
  role: UserRole;
  plan: PlanType;
  planExpiryDate: string; // ISO Date
  isBlocked: boolean;
  onboarded: boolean;
}