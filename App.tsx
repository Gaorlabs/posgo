import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, Product, ProductVariant, CartItem, Transaction, StoreSettings, Purchase, PurchaseItem, PaymentMethod, PaymentDetail, Customer, CashShift, CashMovement, Supplier, UserProfile } from './types';
import { StorageService } from './services/storageService';
import { Layout } from './components/Layout';
import { Cart } from './components/Cart';
import { Ticket } from './components/Ticket';
import { Auth } from './components/Auth';
import { AdminView } from './components/AdminView';
import { OnboardingTour } from './components/OnboardingTour';
import { DEFAULT_SETTINGS, CATEGORIES } from './constants';
import { 
  Search, Plus, Edit, Trash2, TrendingUp, DollarSign, Package, Download,
  Save, Loader2, AlertTriangle, ScanBarcode, ShoppingBag, History, CheckCircle,
  X, Users, UserPlus, Phone, Mail, FileText, BadgePercent, Lock, Unlock,
  Printer, ArrowUpCircle, ArrowDownCircle, Wallet, ChevronLeft, LogOut, ArrowRightLeft,
  Upload, FileSpreadsheet, Filter, Calendar, CreditCard, PieChart as PieChartIcon,
  List, CalendarDays, CalendarRange, Store, LayoutGrid, Truck, MapPin, Image as ImageIcon, Zap, Banknote, Smartphone,
  FileDown, FileUp, Eye, ArrowRight, Layers, Tag, Minus, Archive, ShoppingBasket
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<UserProfile | null>(null);

  // --- Core State ---
  const [view, setView] = useState<ViewState>(ViewState.POS);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  
  // --- Cash State ---
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketType, setTicketType] = useState<'SALE' | 'REPORT'>('SALE');
  const [ticketData, setTicketData] = useState<any>(null);

  // --- SaaS / Tour State ---
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- Modals State ---
  const [showCashControl, setShowCashControl] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashDescription, setCashDescription] = useState('');
  const [cashAction, setCashAction] = useState<'OPEN' | 'CLOSE' | 'IN' | 'OUT'>('IN');

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // --- Inventory Variant State ---
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('');

  // --- POS Variant Selection State ---
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState<Product | null>(null);
  const [posBarcodeBuffer, setPosBarcodeBuffer] = useState(''); // Dedicated buffer for POS scanner

  // --- Product History State ---
  const [showProductHistory, setShowProductHistory] = useState(false);
  const [productHistoryData, setProductHistoryData] = useState<{product: Product, sales: any[], purchases: any[]} | null>(null);

  // --- Purchase / Reception State ---
  const [purchaseTab, setPurchaseTab] = useState<'NEW' | 'HISTORY' | 'SUPPLIERS'>('NEW');
  const [purchaseCart, setPurchaseCart] = useState<PurchaseItem[]>([]);
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [purchaseBarcode, setPurchaseBarcode] = useState('');


  // Initial Load
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setTransactions(StorageService.getTransactions());
    setPurchases(StorageService.getPurchases());
    setSettings(StorageService.getSettings());
    setCustomers(StorageService.getCustomers());
    setSuppliers(StorageService.getSuppliers());
    
    setShifts(StorageService.getShifts());
    setMovements(StorageService.getMovements());
    setActiveShiftId(StorageService.getActiveShiftId());
  }, []);

  // Compute Active Shift
  const activeShift = useMemo(() => shifts.find(s => s.id === activeShiftId), [shifts, activeShiftId]);

  // --- Auth Handlers ---
  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setView(ViewState.ADMIN);
    } else {
      setView(ViewState.POS);
      // Trigger tour if test user
      if (loggedInUser.id === 'test-user-demo') {
         setTimeout(() => setShowOnboarding(true), 500);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView(ViewState.POS);
    setCart([]);
  };

  // --- Cart Logic ---
  const addToCart = (product: Product, variantId?: string) => {
    // If product has variants and no variant selected, show selector
    if (product.hasVariants && !variantId) {
        setProductForVariantSelection(product);
        setShowVariantSelector(true);
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedVariantId === variantId);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedVariantId === variantId)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      // Handle Variant Data
      let finalPrice = product.price;
      let selectedVariantName = undefined;

      if (variantId && product.variants) {
          const variant = product.variants.find(v => v.id === variantId);
          if (variant) {
              finalPrice = variant.price;
              selectedVariantName = variant.name;
          }
      }

      return [...prev, { 
          ...product, 
          price: finalPrice,
          quantity: 1, 
          selectedVariantId: variantId,
          selectedVariantName: selectedVariantName
      }];
    });
  };

  const updateQuantity = (id: string, delta: number, variantId?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedVariantId === variantId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const updateDiscount = (id: string, discount: number, variantId?: string) => {
    setCart(prev => prev.map(item => {
        if (item.id === id && item.selectedVariantId === variantId) {
            return { ...item, discount: discount };
        }
        return item;
    }));
  };

  const removeFromCart = (id: string, variantId?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedVariantId === variantId)));
  };

  const handleCheckout = (method: PaymentMethod, payments: PaymentDetail[]) => {
    if (!activeShift) {
        alert("Debes ABRIR CAJA antes de realizar ventas.");
        setShowCashControl(true);
        setCashAction('OPEN');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
    const total = Math.max(0, subtotal - totalDiscount);
    
    let tax = 0;
    let netSubtotal = 0;

    if (settings.pricesIncludeTax) {
        netSubtotal = total / (1 + settings.taxRate);
        tax = total - netSubtotal;
    } else {
        netSubtotal = total;
        tax = netSubtotal * settings.taxRate;
    }

    // Calculate profit
    let totalCost = 0;
    cart.forEach(item => {
        // If variant, should ideally have variant cost. Fallback to product cost for now.
        const cost = item.cost || 0;
        totalCost += cost * item.quantity;
    });

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: netSubtotal,
      tax,
      discount: totalDiscount,
      total: settings.pricesIncludeTax ? total : (total + tax),
      paymentMethod: method,
      payments: payments,
      profit: (settings.pricesIncludeTax ? total : (total + tax)) - tax - totalCost, // Simple profit approx
      shiftId: activeShift.id
    };

    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    StorageService.saveTransaction(transaction);

    // Update Stock
    const newProducts = products.map(p => {
      const cartItemsForProduct = cart.filter(c => c.id === p.id);
      if (cartItemsForProduct.length === 0) return p;

      let newStock = p.stock;
      let newVariants = p.variants ? [...p.variants] : [];

      cartItemsForProduct.forEach(cItem => {
         if (cItem.selectedVariantId && newVariants.length > 0) {
             // Reduce variant stock
             newVariants = newVariants.map(v => 
                 v.id === cItem.selectedVariantId ? { ...v, stock: v.stock - cItem.quantity } : v
             );
         } else {
             // Reduce main stock
             newStock -= cItem.quantity;
         }
      });
      
      // Update main stock if has variants
      if (p.hasVariants && newVariants.length > 0) {
          newStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
      }

      return { ...p, stock: newStock, variants: newVariants };
    });
    setProducts(newProducts);
    StorageService.saveProducts(newProducts);

    setCart([]);
    setLastTransaction(transaction);
    setTicketType('SALE');
    setTicketData(transaction);
    setShowTicket(true);
  };

  // --- POS SCANNER LOGIC ---
  const handlePosScanner = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          const scannedCode = posBarcodeBuffer.trim();
          if (scannedCode) {
              const product = products.find(p => p.barcode === scannedCode);
              if (product) {
                  addToCart(product);
                  setPosBarcodeBuffer('');
              } else {
                  alert('Producto no encontrado');
              }
          }
      }
  };

  // --- Purchase Logic (Reception) ---
  const handleAddToPurchase = (product: Product) => {
     setPurchaseCart(prev => {
         const existing = prev.find(i => i.productId === product.id);
         if (existing) return prev; 
         return [...prev, { productId: product.id, productName: product.name, quantity: 1, cost: product.cost || 0 }];
     });
     setPurchaseSearchTerm(''); 
     setPurchaseBarcode('');
  };

  const handlePurchaseBarcodeScan = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          const product = products.find(p => p.barcode === purchaseBarcode);
          if (product) {
              handleAddToPurchase(product);
              setPurchaseBarcode(''); // Clear after scan
          } else {
              alert('Producto no encontrado en inventario');
          }
      }
  };

  const updatePurchaseItem = (id: string, field: 'quantity' | 'cost', value: number) => {
     setPurchaseCart(prev => prev.map(item => 
         item.productId === id ? { ...item, [field]: value } : item
     ));
  };

  const removePurchaseItem = (id: string) => {
      setPurchaseCart(prev => prev.filter(i => i.productId !== id));
  };

  const handleConfirmPurchase = () => {
      if(purchaseCart.length === 0) return alert("Agrega al menos un producto.");
      if(!purchaseSupplier) return alert("Debes indicar el proveedor.");

      const totalCost = purchaseCart.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

      const newPurchase: Purchase = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          supplier: purchaseSupplier,
          invoiceNumber: purchaseInvoice || 'S/N',
          items: purchaseCart,
          totalCost: totalCost
      };

      // Update Stock and Cost
      const updatedProducts = products.map(p => {
          const purchasedItem = purchaseCart.find(i => i.productId === p.id);
          if (purchasedItem) {
              return {
                  ...p,
                  stock: p.stock + purchasedItem.quantity,
                  cost: purchasedItem.cost // Update to latest cost
              };
          }
          return p;
      });

      setProducts(updatedProducts);
      StorageService.saveProducts(updatedProducts);
      
      const updatedPurchases = [newPurchase, ...purchases];
      setPurchases(updatedPurchases);
      StorageService.savePurchase(newPurchase);

      // Reset
      setPurchaseCart([]);
      setPurchaseSupplier('');
      setPurchaseInvoice('');
      setPurchaseSearchTerm('');
      setPurchaseTab('HISTORY'); // Go to history to show it done
  };

  // --- Product Management ---
  const handleSaveProduct = () => {
    if (!currentProduct?.name || currentProduct.price <= 0) return;
    
    let productToSave = { ...currentProduct };

    // Auto-calculate total stock if variants exist
    if (productToSave.hasVariants && productToSave.variants) {
        productToSave.stock = productToSave.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }
    
    let updatedProducts;
    if (products.find(p => p.id === productToSave.id)) {
      updatedProducts = products.map(p => p.id === productToSave.id ? productToSave : p);
    } else {
      updatedProducts = [...products, { ...productToSave, id: Date.now().toString() }];
    }
    
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);
    setIsProductModalOpen(false);
    setCurrentProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Eliminar producto?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      StorageService.saveProducts(updated);
    }
  };

  const handleNew = () => {
    setCurrentProduct({ 
      id: '', 
      name: '', 
      price: 0, 
      category: CATEGORIES[0], 
      stock: 0, 
      description: '', 
      barcode: '',
      cost: 0,
      hasVariants: false,
      variants: []
    });
    setIsProductModalOpen(true);
  };

  // --- Variants Management in Inventory ---
  const addVariant = () => {
      if (!variantName || !variantPrice || !currentProduct) return;
      const newVariant: ProductVariant = {
          id: Date.now().toString(),
          name: variantName,
          price: parseFloat(variantPrice),
          stock: parseFloat(variantStock) || 0
      };
      
      const newVariants = [...(currentProduct.variants || []), newVariant];
      // Calculate new total stock
      const newTotalStock = newVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

      setCurrentProduct({
          ...currentProduct,
          variants: newVariants,
          stock: newTotalStock
      });

      setVariantName('');
      setVariantPrice('');
      setVariantStock('');
  };

  const removeVariant = (idx: number) => {
      if (!currentProduct?.variants) return;
      const newVars = [...currentProduct.variants];
      newVars.splice(idx, 1);
      
      // Calculate new total stock
      const newTotalStock = newVars.reduce((sum, v) => sum + (v.stock || 0), 0);

      setCurrentProduct({ ...currentProduct, variants: newVars, stock: newTotalStock });
  };

  // --- Excel Import/Export ---
  const exportInventory = () => {
      const data = products.map(p => ({
          ID: p.id,
          Nombre: p.name,
          Categoria: p.category,
          Precio: p.price,
          Costo: p.cost,
          Stock: p.stock,
          CodigoBarras: p.barcode,
          Variantes: p.hasVariants ? p.variants?.map(v => `${v.name} (${v.stock})`).join(', ') : 'No'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(wb, "Inventario_PosGo.xlsx");
  };

  const importInventory = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          const importedProducts: Product[] = data.map((row: any) => ({
              id: row.ID ? String(row.ID) : Date.now().toString() + Math.random(),
              name: row.Nombre || 'Sin Nombre',
              category: row.Categoria || 'General',
              price: parseFloat(row.Precio) || 0,
              cost: parseFloat(row.Costo) || 0,
              stock: parseFloat(row.Stock) || 0,
              barcode: row.CodigoBarras ? String(row.CodigoBarras) : '',
              hasVariants: false,
              variants: []
          }));

          const merged = [...products, ...importedProducts];
          setProducts(merged);
          StorageService.saveProducts(merged);
          alert(`Se importaron ${importedProducts.length} productos.`);
      };
      reader.readAsBinaryString(file);
  };

  const showHistory = (product: Product) => {
      const prodTransactions = transactions.filter(t => t.items.some(i => i.id === product.id));
      const prodPurchases = purchases.filter(p => p.items.some(i => i.productId === product.id));
      setProductHistoryData({
          product,
          sales: prodTransactions,
          purchases: prodPurchases
      });
      setShowProductHistory(true);
  };

  // --- Cash Management Handlers ---
  const handleCashAction = () => {
    // FIX: Allow 0 as valid input for opening amount, catch only empty strings or true NaN
    const amountVal = cashAmount === '' ? NaN : parseFloat(cashAmount);
    
    if (isNaN(amountVal) && cashAction !== 'CLOSE') {
        alert('Por favor, ingresa un monto válido.');
        return;
    }

    if (cashAction === 'OPEN') {
      if (activeShift) { alert('Ya hay una caja abierta.'); return; }
      const newShift: CashShift = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        startAmount: amountVal,
        status: 'OPEN',
        totalSalesCash: 0,
        totalSalesDigital: 0
      };
      StorageService.saveShift(newShift);
      StorageService.setActiveShiftId(newShift.id);
      setShifts([newShift, ...shifts]);
      setActiveShiftId(newShift.id);
      
      const move: CashMovement = {
        id: Date.now().toString(),
        shiftId: newShift.id,
        type: 'OPEN',
        amount: amountVal,
        description: 'Apertura de Caja',
        timestamp: new Date().toISOString()
      };
      StorageService.saveMovement(move);
      setMovements([...movements, move]);
    } 
    else if (cashAction === 'CLOSE') {
      if (!activeShift) return;
      
      // Calculate totals
      const currentShiftMoves = movements.filter(m => m.shiftId === activeShift.id);
      const salesInShift = transactions.filter(t => t.shiftId === activeShift.id);
      
      let systemCash = activeShift.startAmount;
      let cashSalesTotal = 0;
      let digitalSalesTotal = 0;

      // Add sales
      salesInShift.forEach(t => {
          if (t.payments) {
              t.payments.forEach(p => {
                  if (p.method === 'cash') {
                      systemCash += p.amount;
                      cashSalesTotal += p.amount;
                  } else {
                      digitalSalesTotal += p.amount;
                  }
              });
          } else {
              if (t.paymentMethod === 'cash') {
                  systemCash += t.total;
                  cashSalesTotal += t.total;
              } else {
                  digitalSalesTotal += t.total;
              }
          }
      });

      // Add movements
      currentShiftMoves.forEach(m => {
          if (m.type === 'IN') systemCash += m.amount;
          if (m.type === 'OUT') systemCash -= m.amount;
      });

      const closedShift: CashShift = {
        ...activeShift,
        endTime: new Date().toISOString(),
        endAmount: amountVal || 0, // Real counted amount (can be 0 or empty which means 0)
        expectedAmount: systemCash,
        status: 'CLOSED',
        totalSalesCash: cashSalesTotal,
        totalSalesDigital: digitalSalesTotal
      };

      StorageService.saveShift(closedShift);
      StorageService.setActiveShiftId(null);
      
      setShifts(shifts.map(s => s.id === activeShift.id ? closedShift : s));
      setActiveShiftId(null);

      const move: CashMovement = {
        id: Date.now().toString(),
        shiftId: activeShift.id,
        type: 'CLOSE',
        amount: amountVal || 0,
        description: 'Cierre de Caja',
        timestamp: new Date().toISOString()
      };
      StorageService.saveMovement(move);
      setMovements([...movements, move]);

      // Show Report
      setTicketType('REPORT');
      setTicketData({ shift: closedShift, movements: currentShiftMoves, transactions: salesInShift });
      setShowTicket(true);
    }
    else {
      if (!activeShift) return;
      const move: CashMovement = {
        id: Date.now().toString(),
        shiftId: activeShift.id,
        type: cashAction,
        amount: amountVal,
        description: cashDescription || (cashAction === 'IN' ? 'Ingreso' : 'Salida'),
        timestamp: new Date().toISOString()
      };
      StorageService.saveMovement(move);
      setMovements([...movements, move]);
    }

    setShowCashControl(false);
    setCashAmount('');
    setCashDescription('');
  };

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.barcode?.includes(searchTerm);
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const filteredProductsForPurchase = useMemo(() => {
      if (!purchaseSearchTerm) return [];
      return products.filter(p => 
          p.name.toLowerCase().includes(purchaseSearchTerm.toLowerCase()) ||
          p.barcode?.includes(purchaseSearchTerm)
      );
  }, [products, purchaseSearchTerm]);


  // --- Views Renders ---

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (view === ViewState.ADMIN) {
      return (
          <div className="h-screen bg-[#f8fafc]">
              <AdminView />
              <button onClick={handleLogout} className="fixed bottom-6 right-6 p-4 bg-slate-900 text-white rounded-full shadow-xl hover:bg-black transition-all z-50">
                  <LogOut className="w-6 h-6"/>
              </button>
          </div>
      );
  }

  return (
    <Layout 
        currentView={view} 
        onChangeView={setView} 
        settings={settings}
        user={user}
        onLogout={handleLogout}
    >
      <OnboardingTour isOpen={showOnboarding} onComplete={() => setShowOnboarding(false)} />

      {/* --- INVENTORY VIEW --- */}
      {view === ViewState.INVENTORY && (
        <div className="h-full flex flex-col p-6 animate-fade-in-up">
           <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inventario</h1>
              <div className="flex gap-2">
                 <div className="relative">
                    <input type="file" id="import-excel" className="hidden" accept=".xlsx, .xls" onChange={importInventory}/>
                    <label htmlFor="import-excel" className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                        <Upload className="w-4 h-4 text-violet-500"/> Importar
                    </label>
                 </div>
                 <button onClick={exportInventory} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500"/> Exportar
                 </button>
                 <button 
                    onClick={handleNew}
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-200 hover:scale-105 transition-all flex items-center gap-2"
                 >
                    <Plus className="w-5 h-5"/> Nuevo Producto
                 </button>
              </div>
           </div>
           
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                 <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-50 z-10 text-xs font-black text-slate-400 uppercase tracking-wider">
                       <tr>
                          <th className="p-4 pl-6">Producto</th>
                          <th className="p-4">Categoría</th>
                          <th className="p-4">Costo</th>
                          <th className="p-4">Precio</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4 text-right pr-6">Acciones</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                             <td className="p-4 pl-6">
                                <div className="font-bold text-slate-800">{p.name}</div>
                                {p.barcode && <div className="text-xs text-slate-400 flex items-center gap-1"><ScanBarcode className="w-3 h-3"/> {p.barcode}</div>}
                                {p.hasVariants && <div className="mt-1 flex gap-1 flex-wrap">
                                    {p.variants?.map(v => (
                                        <span key={v.id} className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded border border-violet-100 font-bold">{v.name}</span>
                                    ))}
                                </div>}
                             </td>
                             <td className="p-4"><span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{p.category}</span></td>
                             <td className="p-4 text-sm font-medium text-slate-500">{settings.currency}{p.cost?.toFixed(2)}</td>
                             <td className="p-4 text-sm font-bold text-slate-800">{settings.currency}{p.price.toFixed(2)}</td>
                             <td className="p-4">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                   <Package className="w-3 h-3"/> {p.stock}
                                </div>
                             </td>
                             <td className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => showHistory(p)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"><Eye className="w-4 h-4"/></button>
                                    <button onClick={() => { setCurrentProduct(p); setIsProductModalOpen(true); }} className="p-2 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100 transition-colors"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* --- PURCHASES VIEW (Reception) - REDESIGNED --- */}
      {view === ViewState.PURCHASES && (
        <div className="h-full flex flex-col p-6 animate-fade-in-up font-sans">
           {/* Header */}
           <div className="flex justify-between items-end mb-6">
              <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Recepción de Mercadería</h1>
                  <p className="text-slate-500 font-medium">Gestiona proveedores y entradas de stock</p>
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                  <button onClick={() => setPurchaseTab('NEW')} className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${purchaseTab === 'NEW' ? 'bg-violet-50 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Plus className="w-4 h-4"/> Nueva Recepción
                  </button>
                  <button onClick={() => setPurchaseTab('HISTORY')} className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${purchaseTab === 'HISTORY' ? 'bg-violet-50 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <History className="w-4 h-4"/> Historial
                  </button>
                  <button onClick={() => setPurchaseTab('SUPPLIERS')} className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${purchaseTab === 'SUPPLIERS' ? 'bg-violet-50 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Truck className="w-4 h-4"/> Proveedores
                  </button>
              </div>
           </div>
           
           {/* Main Content Area */}
           <div className="flex-1 overflow-hidden relative">
              {purchaseTab === 'NEW' && (
                  <div className="h-full grid grid-cols-12 gap-6">
                      {/* Left Panel: Inputs */}
                      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                          
                          {/* Provider Card */}
                          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                              <h3 className="font-bold text-slate-800 text-lg mb-4">Datos del Proveedor</h3>
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Proveedor</label>
                                      <input 
                                          type="text" 
                                          placeholder="Buscar o escribir..." 
                                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-100 transition-all"
                                          value={purchaseSupplier}
                                          onChange={e => setPurchaseSupplier(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nº Factura / Guía</label>
                                      <input 
                                          type="text" 
                                          placeholder="F001-000000" 
                                          className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-100 transition-all"
                                          value={purchaseInvoice}
                                          onChange={e => setPurchaseInvoice(e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* Product Search (Violet Box) */}
                          <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[2rem] shadow-xl shadow-violet-200 text-white overflow-visible">
                              {/* Blob Container - Clipped */}
                              <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                              </div>
                              
                              {/* Content - Not Clipped */}
                              <div className="relative z-10 p-6">
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><ScanBarcode className="w-6 h-6 text-white"/></div>
                                      <h3 className="font-bold text-lg">Agregar Productos</h3>
                                  </div>
                                  
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-[10px] font-bold text-white/60 uppercase mb-2">Escáner</label>
                                          <div className="relative">
                                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l-xl"></div>
                                              <input 
                                                  type="text" 
                                                  placeholder="Escanea el código aquí..." 
                                                  className="w-full pl-4 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-200 font-mono text-sm outline-none focus:bg-white/20 transition-all"
                                                  value={purchaseBarcode}
                                                  onChange={e => setPurchaseBarcode(e.target.value)}
                                                  onKeyDown={handlePurchaseBarcodeScan}
                                                  autoFocus
                                              />
                                          </div>
                                      </div>
                                      <div className="relative">
                                          <div className="flex items-center gap-2 mb-2">
                                              <div className="h-px bg-white/20 flex-1"></div>
                                              <span className="text-[10px] font-bold text-white/50 uppercase">O BUSCAR</span>
                                              <div className="h-px bg-white/20 flex-1"></div>
                                          </div>
                                          <div className="relative">
                                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-200"/>
                                              <input 
                                                  type="text" 
                                                  placeholder="Nombre del producto..." 
                                                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-violet-200 text-sm outline-none focus:bg-white/20 transition-all"
                                                  value={purchaseSearchTerm}
                                                  onChange={e => setPurchaseSearchTerm(e.target.value)}
                                              />
                                          </div>
                                          
                                          {/* Search Results Dropdown */}
                                          {purchaseSearchTerm && (
                                              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto z-50 custom-scrollbar border border-slate-100">
                                                  {filteredProductsForPurchase.length > 0 ? (
                                                      filteredProductsForPurchase.map(p => (
                                                          <div 
                                                              key={p.id} 
                                                              onClick={() => handleAddToPurchase(p)}
                                                              className="p-3 hover:bg-violet-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                          >
                                                              <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                                                              <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                                  <span>Stock: {p.stock}</span>
                                                                  <span>Costo: {settings.currency}{p.cost}</span>
                                                              </div>
                                                          </div>
                                                      ))
                                                  ) : (
                                                      <div className="p-4 text-center text-slate-400 text-xs font-medium">No encontrado</div>
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Right Panel: List */}
                      <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                          {/* Header List */}
                          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                                  Productos a Ingresar <span className="ml-2 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{purchaseCart.length}</span>
                              </h3>
                              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold border border-emerald-100">
                                  Total: {settings.currency}{purchaseCart.reduce((s, i) => s + (i.quantity * i.cost), 0).toFixed(2)}
                              </div>
                          </div>

                          {/* List Content */}
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                              {purchaseCart.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center opacity-50">
                                      <ShoppingBag className="w-16 h-16 text-slate-300 mb-4"/>
                                      <p className="text-slate-400 font-medium">Lista vacía</p>
                                  </div>
                              ) : (
                                  <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                                      <thead className="text-xs font-bold text-slate-400 uppercase">
                                          <tr>
                                              <th className="px-4 py-2">Producto</th>
                                              <th className="px-4 py-2 w-32 text-center">Cantidad</th>
                                              <th className="px-4 py-2 w-32 text-center">Costo Unit.</th>
                                              <th className="px-4 py-2 w-32 text-right">Subtotal</th>
                                              <th className="px-4 py-2 w-10"></th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {purchaseCart.map(item => (
                                              <tr key={item.productId} className="bg-white hover:bg-slate-50 transition-colors shadow-sm rounded-xl">
                                                  <td className="px-4 py-3 font-bold text-slate-700 rounded-l-xl border-y border-l border-slate-100">{item.productName}</td>
                                                  <td className="px-4 py-3 border-y border-slate-100">
                                                      <input 
                                                          type="number" 
                                                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-violet-400"
                                                          value={item.quantity}
                                                          onChange={e => updatePurchaseItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)}
                                                      />
                                                  </td>
                                                  <td className="px-4 py-3 border-y border-slate-100">
                                                      <div className="relative">
                                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{settings.currency}</span>
                                                          <input 
                                                              type="number" 
                                                              className="w-full pl-6 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-violet-400"
                                                              value={item.cost}
                                                              onChange={e => updatePurchaseItem(item.productId, 'cost', parseFloat(e.target.value) || 0)}
                                                          />
                                                      </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right font-black text-slate-800 border-y border-slate-100">
                                                      {settings.currency}{(item.quantity * item.cost).toFixed(2)}
                                                  </td>
                                                  <td className="px-4 py-3 rounded-r-xl border-y border-r border-slate-100 text-center">
                                                      <button onClick={() => removePurchaseItem(item.productId)} className="text-red-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              )}
                          </div>

                          {/* Footer Actions */}
                          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                              <button 
                                  onClick={handleConfirmPurchase}
                                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                              >
                                  <CheckCircle className="w-5 h-5"/> Procesar Ingreso
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {purchaseTab === 'HISTORY' && (
                  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
                      <div className="overflow-y-auto p-4 custom-scrollbar flex-1">
                       {purchases.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400">
                               <Archive className="w-16 h-16 mb-4 opacity-50"/>
                               <p>No hay historial de recepciones.</p>
                           </div>
                       ) : (
                           <table className="w-full text-left">
                               <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                                   <tr>
                                       <th className="p-4 rounded-l-xl">Fecha</th>
                                       <th className="p-4">Proveedor</th>
                                       <th className="p-4">Factura</th>
                                       <th className="p-4">Ítems</th>
                                       <th className="p-4 rounded-r-xl text-right">Total</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                   {purchases.map(p => (
                                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                           <td className="p-4 font-bold text-slate-700 text-sm">
                                               {new Date(p.date).toLocaleDateString()}
                                               <div className="text-xs text-slate-400 font-normal">{new Date(p.date).toLocaleTimeString()}</div>
                                           </td>
                                           <td className="p-4 font-bold text-slate-800">{p.supplier}</td>
                                           <td className="p-4 text-sm text-slate-500 font-mono">{p.invoiceNumber}</td>
                                           <td className="p-4">
                                               <div className="flex items-center gap-1">
                                                   <Package className="w-4 h-4 text-slate-400"/>
                                                   <span className="text-sm font-bold text-slate-600">{p.items.length} productos</span>
                                               </div>
                                           </td>
                                           <td className="p-4 text-right font-black text-emerald-600">
                                               {settings.currency}{p.totalCost.toFixed(2)}
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       )}
                       </div>
                  </div>
              )}

              {purchaseTab === 'SUPPLIERS' && (
                  <div className="flex items-center justify-center h-full bg-white rounded-[2.5rem] border border-slate-100">
                      <div className="text-center text-slate-400">
                          <Truck className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                          <p className="font-bold text-lg">Gestión de Proveedores</p>
                          <p className="text-sm">Próximamente disponible.</p>
                      </div>
                  </div>
              )}
           </div>
        </div>
      )}

      {/* --- CUSTOMERS VIEW --- */}
      {view === ViewState.CUSTOMERS && (
        <div className="h-full flex flex-col p-6 animate-fade-in-up">
           <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Clientes</h1>
              <button 
                  onClick={() => { setCurrentCustomer({ id: '', name: '', phone: '', totalPurchases: 0 }); setShowCustomerModal(true); }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black flex items-center gap-2"
              >
                  <UserPlus className="w-5 h-5"/> Nuevo Cliente
              </button>
           </div>
           
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-hidden p-4">
              {customers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-12 h-12 mb-4 text-slate-200"/>
                      <p>No hay clientes registrados.</p>
                  </div>
              ) : (
                  <div className="overflow-y-auto h-full custom-scrollbar">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                              <tr>
                                  <th className="p-4 rounded-l-xl">Nombre</th>
                                  <th className="p-4">Teléfono</th>
                                  <th className="p-4">Compras</th>
                                  <th className="p-4 rounded-r-xl">Última Visita</th>
                              </tr>
                          </thead>
                          <tbody>
                              {customers.map(c => (
                                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                      <td className="p-4 font-bold text-slate-700">{c.name}</td>
                                      <td className="p-4 text-sm text-slate-500">{c.phone || '-'}</td>
                                      <td className="p-4 text-sm font-bold text-violet-600">{c.totalPurchases}</td>
                                      <td className="p-4 text-sm text-slate-400">{c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
           </div>

           {/* Simple Customer Modal */}
           {showCustomerModal && currentCustomer && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl animate-bounce-slight">
                      <h2 className="text-xl font-black mb-4">Nuevo Cliente</h2>
                      <div className="space-y-4">
                          <input 
                              type="text" placeholder="Nombre Completo" 
                              className="w-full p-3 border rounded-xl"
                              value={currentCustomer.name}
                              onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                          />
                          <input 
                              type="text" placeholder="Teléfono" 
                              className="w-full p-3 border rounded-xl"
                              value={currentCustomer.phone}
                              onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                          />
                          <input 
                              type="text" placeholder="DNI / RUC (Opcional)" 
                              className="w-full p-3 border rounded-xl"
                              value={currentCustomer.dni}
                              onChange={e => setCurrentCustomer({...currentCustomer, dni: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-2 mt-6">
                          <button onClick={() => setShowCustomerModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Cancelar</button>
                          <button 
                              onClick={() => {
                                  if(!currentCustomer.name) return;
                                  const newCust = { ...currentCustomer, id: Date.now().toString() };
                                  const updated = [...customers, newCust];
                                  setCustomers(updated);
                                  StorageService.saveCustomers(updated);
                                  setShowCustomerModal(false);
                              }}
                              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold"
                          >
                              Guardar
                          </button>
                      </div>
                  </div>
              </div>
           )}
        </div>
      )}

      {/* --- REPORTS VIEW --- */}
      {view === ViewState.SALES && (
        <div className="h-full flex flex-col p-6 animate-fade-in-up overflow-y-auto">
           <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Reportes</h1>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase">Ventas Hoy</p>
                   <h3 className="text-3xl font-black text-slate-800 mt-2">{settings.currency}{transactions.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).reduce((s, t) => s + t.total, 0).toFixed(2)}</h3>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase">Transacciones</p>
                   <h3 className="text-3xl font-black text-violet-600 mt-2">{transactions.length}</h3>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase">Producto Top</p>
                   <h3 className="text-lg font-black text-slate-800 mt-2 truncate">
                       {/* Simple logic for top product */}
                       Café Americano
                   </h3>
               </div>
           </div>

           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-80 flex items-center justify-center">
               <p className="text-slate-400 font-medium">Gráficos detallados próximamente...</p>
           </div>
        </div>
      )}

      {/* --- SETTINGS VIEW --- */}
      {view === ViewState.SETTINGS && (
        <div className="h-full flex flex-col p-6 animate-fade-in-up overflow-y-auto">
           <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-8">Configuración</h1>
           
           <div className="max-w-2xl bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
               <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Negocio</label>
                       <input 
                          type="text" 
                          value={settings.storeName}
                          onChange={e => setSettings({...settings, storeName: e.target.value})}
                          className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-violet-400"
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-2">RUC / ID Fiscal</label>
                       <input 
                          type="text" 
                          value={settings.ruc}
                          onChange={e => setSettings({...settings, ruc: e.target.value})}
                          className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-violet-400"
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Teléfono</label>
                       <input 
                          type="text" 
                          value={settings.phone}
                          onChange={e => setSettings({...settings, phone: e.target.value})}
                          className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-violet-400"
                       />
                   </div>
                   <div className="col-span-2">
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dirección</label>
                       <input 
                          type="text" 
                          value={settings.address}
                          onChange={e => setSettings({...settings, address: e.target.value})}
                          className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-violet-400"
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Moneda</label>
                       <input 
                          type="text" 
                          value={settings.currency}
                          onChange={e => setSettings({...settings, currency: e.target.value})}
                          className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-violet-400"
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Impuesto (%)</label>
                       <input 
                          type="number" 
                          value={settings.taxRate}
                          onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
                          className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-violet-400"
                       />
                   </div>
               </div>
               
               <div className="pt-6 border-t border-slate-100">
                   <button 
                      onClick={() => { StorageService.saveSettings(settings); alert("Guardado"); }}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg"
                   >
                       Guardar Configuración
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* --- POS VIEW (REDESIGNED) --- */}
      {view === ViewState.POS && (
        <>
            {!activeShift ? (
                // --- CASH CLOSED STATE (BLOCKER) ---
                <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 -z-10"></div>
                    <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl border border-white/50 max-w-lg w-full relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-200 animate-float">
                            <Lock className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">Caja Cerrada</h2>
                        <p className="text-slate-500 font-medium text-lg mb-8 leading-relaxed">
                            Para comenzar a vender, primero debes abrir tu turno de caja. Esto asegura que tu dinero esté siempre cuadrado.
                        </p>
                        <button 
                            onClick={() => { setShowCashControl(true); setCashAction('OPEN'); }}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            <Wallet className="w-6 h-6 group-hover:rotate-12 transition-transform"/>
                            <span>Abrir Caja Ahora</span>
                        </button>
                    </div>
                </div>
            ) : (
                // --- ACTIVE POS STATE (REDESIGNED TO MATCH IMAGE) ---
                <div className="h-full flex overflow-hidden">
                {/* Products Grid */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    
                    {/* Header POS (Updated to match image) */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                <h2 className="text-sm font-bold text-emerald-700 tracking-wide uppercase">CAJA ABIERTA</h2>
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-1 ml-5">Turno #{activeShift.id.slice(-4)}</p>
                        </div>
                        
                        <button 
                            id="btn-cash-control"
                            onClick={() => { setShowCashControl(true); setCashAction('IN'); }}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-black transition-all hover:scale-[1.02]"
                        >
                            <Wallet className="w-4 h-4"/>
                            Control Caja
                        </button>
                    </div>

                    {/* Dedicated Scanner Bar & View Toggle */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 h-[60px] items-center">
                            <button className="h-full aspect-square flex items-center justify-center bg-violet-100 text-violet-600 rounded-xl">
                                <LayoutGrid className="w-6 h-6"/>
                            </button>
                            <button className="h-full aspect-square flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                <List className="w-6 h-6"/>
                            </button>
                        </div>
                        
                        <div className="flex-1 relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <ScanBarcode className="w-6 h-6 text-violet-500 group-focus-within:text-violet-600 transition-colors" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Escanear código..."
                                className="w-full h-[60px] pl-16 pr-4 bg-white border-2 border-violet-100 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-50 outline-none font-bold text-lg text-slate-700 transition-all placeholder-slate-300"
                                value={posBarcodeBuffer}
                                onChange={(e) => setPosBarcodeBuffer(e.target.value)}
                                onKeyDown={handlePosScanner}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Search & Categories */}
                    <div className="flex gap-4 mb-6 items-center overflow-x-auto pb-1" id="pos-search-bar">
                        <div className="w-64 relative shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                            <input 
                                type="text" 
                                placeholder="Buscar producto..." 
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all font-bold text-sm text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2" id="pos-categories">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                                        selectedCategory === cat 
                                        ? 'bg-slate-800 text-white shadow-slate-300 transform scale-105' 
                                        : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid (Updated Cards) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar" id="pos-products-grid">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredProducts.map((p, idx) => (
                                <div 
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 cursor-pointer group hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between h-48 animate-fade-in-up"
                                    style={{animationDelay: `${idx * 50}ms`}}
                                >
                                    {/* Top: Stock Badge */}
                                    <div className="flex justify-end">
                                        <div className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500">
                                            {p.stock} un.
                                        </div>
                                    </div>

                                    {/* Middle: Icon/Letter */}
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-slate-200 font-black text-6xl select-none group-hover:scale-110 transition-transform duration-300 group-hover:text-violet-100">
                                            {p.name.charAt(0)}
                                        </div>
                                        {p.hasVariants && <Layers className="absolute top-4 left-4 w-4 h-4 text-violet-300"/>}
                                    </div>
                                    
                                    {/* Bottom: Info */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{p.category}</p>
                                        <h3 className="font-bold text-slate-800 leading-tight mb-2 truncate">{p.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-black text-slate-800">{settings.currency}{p.price.toFixed(2)}</span>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                                <ShoppingBasket className="w-4 h-4"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart Sidebar */}
                <div className="w-[400px] bg-white shadow-2xl z-20" id="pos-cart">
                    <Cart 
                        items={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromCart}
                        onUpdateDiscount={updateDiscount}
                        onCheckout={handleCheckout}
                        onClearCart={() => setCart([])}
                        settings={settings}
                        customers={customers}
                    />
                </div>
                </div>
            )}
        </>
      )}

      {/* --- MODALS --- */}

      {/* Product Form Modal */}
      {isProductModalOpen && currentProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-bounce-slight">
               <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <h2 className="text-xl font-black text-slate-800">
                       {currentProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
                   </h2>
                   <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
               </div>
               
               <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                       <div className="col-span-2">
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Producto</label>
                           <input 
                              type="text" 
                              value={currentProduct.name}
                              onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-violet-500 outline-none transition-colors"
                              placeholder="Ej. Coca Cola 500ml"
                           />
                       </div>
                       
                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Precio Venta</label>
                           <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">{settings.currency}</span>
                               <input 
                                  type="number" 
                                  value={currentProduct.price}
                                  onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value) || 0})}
                                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-violet-500 outline-none"
                               />
                           </div>
                       </div>
                       
                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Costo (Compra)</label>
                           <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">{settings.currency}</span>
                               <input 
                                  type="number" 
                                  value={currentProduct.cost}
                                  onChange={e => setCurrentProduct({...currentProduct, cost: parseFloat(e.target.value) || 0})}
                                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-violet-500 outline-none"
                               />
                           </div>
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Categoría</label>
                           <select 
                              value={currentProduct.category}
                              onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-violet-500 outline-none"
                           >
                               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Actual</label>
                           <input 
                              type="number" 
                              value={currentProduct.stock}
                              onChange={e => setCurrentProduct({...currentProduct, stock: parseFloat(e.target.value) || 0})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-violet-500 outline-none"
                              disabled={currentProduct.hasVariants}
                           />
                       </div>

                       <div className="col-span-2">
                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={currentProduct.hasVariants || false} 
                                    onChange={e => setCurrentProduct({...currentProduct, hasVariants: e.target.checked})}
                                    className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                                />
                                <span className="font-bold text-slate-700">Este producto tiene variantes (Tallas, Colores, etc.)</span>
                            </label>
                       </div>

                       {currentProduct.hasVariants && (
                           <div className="col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                               <h4 className="font-bold text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4"/> Configurar Variantes</h4>
                               
                               <div className="flex gap-2 items-end">
                                   <div className="flex-1">
                                       <label className="text-[10px] uppercase font-bold text-slate-400">Nombre (Ej. Rojo)</label>
                                       <input type="text" value={variantName} onChange={e => setVariantName(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold"/>
                                   </div>
                                   <div className="w-24">
                                       <label className="text-[10px] uppercase font-bold text-slate-400">Precio</label>
                                       <input type="number" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold"/>
                                   </div>
                                   <div className="w-24">
                                       <label className="text-[10px] uppercase font-bold text-slate-400">Stock</label>
                                       <input type="number" value={variantStock} onChange={e => setVariantStock(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold"/>
                                   </div>
                                   <button onClick={addVariant} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-black"><Plus className="w-5 h-5"/></button>
                               </div>

                               <div className="space-y-2">
                                   {currentProduct.variants?.map((v, idx) => (
                                       <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                           <span className="font-bold text-slate-700">{v.name}</span>
                                           <div className="flex items-center gap-4 text-sm">
                                               <span className="text-slate-500">{settings.currency}{v.price}</span>
                                               <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">{v.stock} u.</span>
                                               <button onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>
               </div>
               
               <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                   <button onClick={() => setIsProductModalOpen(false)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                   <button onClick={handleSaveProduct} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black hover:scale-105 transition-all shadow-lg">Guardar Producto</button>
               </div>
           </div>
        </div>
      )}

      {/* Variant Selector Modal (POS) */}
      {showVariantSelector && productForVariantSelection && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="text-xl font-black text-slate-800">{productForVariantSelection.name}</h3>
                          <p className="text-slate-500 font-medium text-sm">Selecciona una opción</p>
                      </div>
                      <button onClick={() => setShowVariantSelector(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                      {productForVariantSelection.variants?.map(v => (
                          <button 
                             key={v.id}
                             onClick={() => {
                                 addToCart(productForVariantSelection, v.id);
                                 setShowVariantSelector(false);
                                 setProductForVariantSelection(null);
                             }}
                             disabled={v.stock <= 0}
                             className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                 v.stock > 0 
                                 ? 'border-slate-100 bg-white hover:border-violet-500 hover:bg-violet-50 hover:shadow-lg' 
                                 : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                             }`}
                          >
                              <span className="font-bold text-slate-800">{v.name}</span>
                              <div className="flex items-center gap-2 text-sm">
                                  <span className="text-violet-600 font-black">{settings.currency}{v.price}</span>
                                  <span className={`text-[10px] px-2 rounded-full ${v.stock>0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{v.stock} u.</span>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Cash Control Modal */}
      {showCashControl && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                 <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-slate-700"/> Control de Caja
                    </h2>
                    <button onClick={() => setShowCashControl(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-6 h-6"/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                     {/* Summary Cards */}
                     {activeShift && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                             <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                                <Banknote className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-emerald-200 opacity-50"/>
                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Efectivo en Caja (Teórico)</p>
                                <h3 className="text-4xl font-black text-emerald-800 tracking-tight">
                                    {settings.currency}{(
                                        activeShift.startAmount + 
                                        movements.filter(m => m.shiftId === activeShift.id && m.type === 'IN').reduce((s, m) => s + m.amount, 0) -
                                        movements.filter(m => m.shiftId === activeShift.id && m.type === 'OUT').reduce((s, m) => s + m.amount, 0) +
                                        transactions.filter(t => t.shiftId === activeShift.id).reduce((sum, t) => {
                                            if(t.payments) return sum + t.payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
                                            return t.paymentMethod === 'cash' ? sum + t.total : sum;
                                        }, 0)
                                    ).toFixed(2)}
                                </h3>
                             </div>

                             <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 relative overflow-hidden">
                                <Smartphone className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-purple-200 opacity-50"/>
                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Ventas Digitales (Yape/Plin/Tarj)</p>
                                <h3 className="text-4xl font-black text-purple-800 tracking-tight">
                                    {settings.currency}{transactions.filter(t => t.shiftId === activeShift.id).reduce((sum, t) => {
                                            if(t.payments) return sum + t.payments.filter(p => p.method !== 'cash').reduce((s, p) => s + p.amount, 0);
                                            return t.paymentMethod !== 'cash' ? sum + t.total : sum;
                                        }, 0).toFixed(2)}
                                </h3>
                             </div>

                             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col justify-center items-center text-center">
                                 <p className="text-xs font-bold text-slate-400 uppercase">Inicio de Caja</p>
                                 <p className="text-2xl font-black text-slate-700">{settings.currency}{activeShift.startAmount.toFixed(2)}</p>
                                 <p className="text-xs text-slate-400 mt-1">{new Date(activeShift.startTime).toLocaleTimeString()}</p>
                             </div>
                        </div>
                     )}

                     {/* Action Tabs */}
                     <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                         {!activeShift ? (
                             <button onClick={() => setCashAction('OPEN')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${cashAction === 'OPEN' ? 'bg-white text-emerald-600 shadow' : 'text-slate-400'}`}>APERTURA DE CAJA</button>
                         ) : (
                             <>
                                <button onClick={() => setCashAction('IN')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${cashAction === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>INGRESO</button>
                                <button onClick={() => setCashAction('OUT')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${cashAction === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>SALIDA / GASTO</button>
                                <button onClick={() => setCashAction('CLOSE')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${cashAction === 'CLOSE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>CIERRE DE TURNO</button>
                             </>
                         )}
                     </div>

                     {/* Form */}
                     <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
                         <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2">
                             {cashAction === 'OPEN' && <span className="text-emerald-600">🚀 Iniciar Turno</span>}
                             {cashAction === 'IN' && <span className="text-emerald-600">💰 Registrar Ingreso Extra</span>}
                             {cashAction === 'OUT' && <span className="text-red-600">💸 Registrar Gasto / Retiro</span>}
                             {cashAction === 'CLOSE' && <span className="text-slate-800">🔒 Cerrar Caja</span>}
                         </h3>

                         <div className="flex gap-4 items-end">
                             <div className="flex-1">
                                 <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monto</label>
                                 <div className="relative">
                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">{settings.currency}</span>
                                     <input 
                                        type="number" 
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-violet-500 outline-none font-bold text-2xl text-slate-800 transition-colors"
                                        placeholder="0.00"
                                        autoFocus
                                     />
                                 </div>
                             </div>
                             {cashAction !== 'OPEN' && (
                                 <div className="flex-[2]">
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Motivo / Descripción</label>
                                     <input 
                                        type="text" 
                                        value={cashDescription}
                                        onChange={(e) => setCashDescription(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-violet-500 outline-none font-bold text-lg text-slate-800 transition-colors"
                                        placeholder={cashAction === 'CLOSE' ? 'Observaciones de cierre...' : 'Ej. Pago proveedores'}
                                     />
                                 </div>
                             )}
                             <button 
                                onClick={handleCashAction}
                                className={`px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                                    cashAction === 'OUT' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-slate-900 hover:bg-black shadow-slate-300'
                                }`}
                             >
                                 CONFIRMAR
                             </button>
                         </div>
                         {cashAction === 'CLOSE' && (
                             <p className="mt-4 text-sm text-slate-500 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-2">
                                 <AlertTriangle className="w-5 h-5 text-yellow-500"/>
                                 <b>Importante:</b> Ingresa el monto REAL de efectivo que has contado en el cajón. El sistema calculará la diferencia automáticamente.
                             </p>
                         )}
                     </div>
                     
                     {/* Movements History */}
                     {activeShift && (
                         <div>
                             <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><History className="w-5 h-5"/> Historial del Turno</h4>
                             <div className="space-y-3">
                                 {movements.filter(m => m.shiftId === activeShift.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(m => (
                                     <div key={m.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                         <div className="flex items-center gap-4">
                                             <div className={`p-2 rounded-xl ${
                                                 m.type === 'OPEN' ? 'bg-blue-100 text-blue-600' :
                                                 m.type === 'IN' ? 'bg-emerald-100 text-emerald-600' :
                                                 m.type === 'OUT' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                             }`}>
                                                 {m.type === 'OPEN' && <Store className="w-5 h-5"/>}
                                                 {m.type === 'IN' && <ArrowDownCircle className="w-5 h-5"/>}
                                                 {m.type === 'OUT' && <ArrowUpCircle className="w-5 h-5"/>}
                                                 {m.type === 'CLOSE' && <Lock className="w-5 h-5"/>}
                                             </div>
                                             <div>
                                                 <p className="font-bold text-slate-800">{m.description}</p>
                                                 <p className="text-xs text-slate-400">{new Date(m.timestamp).toLocaleTimeString()}</p>
                                             </div>
                                         </div>
                                         <span className={`font-mono font-bold text-lg ${m.type === 'OUT' ? 'text-red-500' : 'text-emerald-600'}`}>
                                             {m.type === 'OUT' ? '-' : '+'}{settings.currency}{m.amount.toFixed(2)}
                                         </span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}

                 </div>
             </div>
         </div>
      )}
      
      {/* Ticket Modal */}
      {showTicket && ticketData && (
        <Ticket 
           type={ticketType}
           data={ticketData}
           settings={settings}
           onClose={() => setShowTicket(false)}
        />
      )}

      {/* Product History Modal */}
      {showProductHistory && productHistoryData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-up">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h2 className="text-xl font-black text-slate-800">Historial: {productHistoryData.product.name}</h2>
                          <p className="text-sm text-slate-500 font-medium">Movimientos de Inventario</p>
                      </div>
                      <button onClick={() => setShowProductHistory(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500"/></button>
                  </div>
                  <div className="p-8 overflow-y-auto custom-scrollbar">
                      <div className="space-y-6">
                          <div>
                              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><TrendingUp className="w-4 h-4"/> Ventas Recientes</h3>
                              {productHistoryData.sales.length === 0 ? <p className="text-slate-400 italic text-sm">No hay ventas registradas.</p> : (
                                  <div className="space-y-2">
                                      {productHistoryData.sales.map(s => {
                                          const item = s.items.find((i: CartItem) => i.id === productHistoryData.product.id);
                                          return (
                                              <div key={s.id} className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                                                  <span className="text-slate-600">{new Date(s.date).toLocaleString()}</span>
                                                  <span className="font-bold text-slate-800">-{item?.quantity} un.</span>
                                              </div>
                                          )
                                      })}
                                  </div>
                              )}
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><Truck className="w-4 h-4"/> Entradas (Compras)</h3>
                              {productHistoryData.purchases.length === 0 ? <p className="text-slate-400 italic text-sm">No hay compras registradas.</p> : (
                                  <div className="space-y-2">
                                      {productHistoryData.purchases.map(p => {
                                          const item = p.items.find((i: PurchaseItem) => i.productId === productHistoryData.product.id);
                                          return (
                                              <div key={p.id} className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                                                  <span className="text-slate-600">{new Date(p.date).toLocaleString()}</span>
                                                  <span className="font-bold text-emerald-600">+{item?.quantity} un.</span>
                                              </div>
                                          )
                                      })}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </Layout>
  );
};

export default App;