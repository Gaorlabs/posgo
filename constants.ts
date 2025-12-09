import { Product, StoreSettings } from "./types";

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "PosGo!",
  ruc: "20123456789",
  address: "Av. Principal 123, Lima",
  phone: "(01) 234-5678",
  taxRate: 0.18, // IGV Peru standard
  currency: "S/.",
  pricesIncludeTax: true, // Default: Prices already include IGV (Do not add on top)
  logo: undefined
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Café Americano', price: 5.50, category: 'Bebidas', stock: 100, description: 'Café negro recién hecho', barcode: '001', cost: 2.00 },
  { id: '2', name: 'Cappuccino', price: 7.50, category: 'Bebidas', stock: 50, description: 'Espresso con leche espumada', barcode: '002', cost: 3.50 },
  { id: '3', name: 'Croissant', price: 4.00, category: 'Panadería', stock: 20, description: 'Croissant de mantequilla', barcode: '003', cost: 1.50 },
  { id: '4', name: 'Sandwich de Pollo', price: 12.00, category: 'Comida', stock: 15, description: 'Sandwich fresco con pollo y vegetales', barcode: '004', cost: 6.00 },
  { id: '5', name: 'Agua Mineral', price: 2.50, category: 'Bebidas', stock: 200, description: '500ml', barcode: '775001', cost: 1.00 },
  { id: '6', name: 'Galleta de Chispas', price: 3.00, category: 'Panadería', stock: 40, description: 'Galleta casera con chocolate', barcode: '006', cost: 1.20 },
  { id: '7', name: 'Ensalada Cesar', price: 15.00, category: 'Comida', stock: 10, description: 'Lechuga, crotones y aderezo cesar', barcode: '007', cost: 8.00 },
  { id: '8', name: 'Jugo de Naranja', price: 8.00, category: 'Bebidas', stock: 30, description: 'Recién exprimido', barcode: '008', cost: 3.00 },
];

export const CATEGORIES = ['Todos', 'Bebidas', 'Comida', 'Panadería', 'Otros'];