import { Product, StoreSettings, Transaction, Purchase, Customer, CashShift, CashMovement, Supplier, UserProfile } from "../types";
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS } from "../constants";

const KEYS = {
  PRODUCTS: 'kioscopro_products',
  TRANSACTIONS: 'kioscopro_transactions',
  PURCHASES: 'kioscopro_purchases',
  SETTINGS: 'kioscopro_settings',
  CUSTOMERS: 'kioscopro_customers',
  SHIFTS: 'kioscopro_shifts',
  MOVEMENTS: 'kioscopro_movements',
  ACTIVE_SHIFT_ID: 'kioscopro_active_shift_id',
  SUPPLIERS: 'kioscopro_suppliers',
  SESSION: 'kioscopro_session' // New Key for Auth persistence
};

export const StorageService = {
  // --- Auth Session Management ---
  getSession: (): UserProfile | null => {
    const stored = localStorage.getItem(KEYS.SESSION);
    return stored ? JSON.parse(stored) : null;
  },

  saveSession: (user: UserProfile) => {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  // --- Data Management ---
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getTransactions: (): Transaction[] => {
    const stored = localStorage.getItem(KEYS.TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  },

  saveTransaction: (transaction: Transaction) => {
    const transactions = StorageService.getTransactions();
    transactions.unshift(transaction); // Add to beginning
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getPurchases: (): Purchase[] => {
    const stored = localStorage.getItem(KEYS.PURCHASES);
    return stored ? JSON.parse(stored) : [];
  },

  savePurchase: (purchase: Purchase) => {
    const purchases = StorageService.getPurchases();
    purchases.unshift(purchase);
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
  },

  getSettings: (): StoreSettings => {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: StoreSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCustomers: (): Customer[] => {
    const stored = localStorage.getItem(KEYS.CUSTOMERS);
    return stored ? JSON.parse(stored) : [];
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getSuppliers: (): Supplier[] => {
    const stored = localStorage.getItem(KEYS.SUPPLIERS);
    return stored ? JSON.parse(stored) : [];
  },

  saveSuppliers: (suppliers: Supplier[]) => {
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  // --- Cash Management ---

  getShifts: (): CashShift[] => {
    const stored = localStorage.getItem(KEYS.SHIFTS);
    return stored ? JSON.parse(stored) : [];
  },

  saveShift: (shift: CashShift) => {
    const shifts = StorageService.getShifts();
    const index = shifts.findIndex(s => s.id === shift.id);
    if (index >= 0) {
      shifts[index] = shift;
    } else {
      shifts.unshift(shift);
    }
    localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
  },

  getMovements: (): CashMovement[] => {
    const stored = localStorage.getItem(KEYS.MOVEMENTS);
    return stored ? JSON.parse(stored) : [];
  },

  saveMovement: (movement: CashMovement) => {
    const movements = StorageService.getMovements();
    movements.push(movement);
    localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  getActiveShiftId: (): string | null => {
    return localStorage.getItem(KEYS.ACTIVE_SHIFT_ID);
  },

  setActiveShiftId: (id: string | null) => {
    if (id) {
      localStorage.setItem(KEYS.ACTIVE_SHIFT_ID, id);
    } else {
      localStorage.removeItem(KEYS.ACTIVE_SHIFT_ID);
    }
  }
};