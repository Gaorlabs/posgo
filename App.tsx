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
  FileDown, FileUp, Eye, ArrowRight, Layers, Tag, Minus, Archive, ShoppingBasket, Flame, AlertCircle, RefreshCw, Clock, Coins
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

  // --- Inventory State ---
  const [inventoryTab, setInventoryTab] = useState<'ALL' | 'REPLENISHMENT'>('ALL');
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
    // 1. Recover Session
    const savedUser = StorageService.getSession();
    if (savedUser) {
        setUser(savedUser);
        if (savedUser.role === 'admin') setView(ViewState.ADMIN);
    }

    // 2. Load Data
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

  // Safe Shift Totals Calculation (Prevents Crash)
  const currentShiftTotals = useMemo(() => {
      if (!activeShift) return { cash: 0, digital: 0, start: 0 };
      
      try {
          const shiftMoves = movements.filter(m => m.shiftId === activeShift.id);
          const shiftTrans = transactions.filter(t => t.shiftId === activeShift.id);

          const start = activeShift.startAmount || 0;
          
          let cash = start;
          let digital = 0;

          // Add Sales
          shiftTrans.forEach(t => {
              if (t.payments) {
                  t.payments.forEach(p => {
                      if (p.method === 'cash') cash += p.amount;
                      else digital += p.amount;
                  });
              } else {
                  if (t.paymentMethod === 'cash') cash += t.total;
                  else digital += t.total;
              }
          });

          // Add Movements
          shiftMoves.forEach(m => {
              if (m.type === 'IN') cash += m.amount;
              if (m.type === 'OUT') cash -= m.amount;
          });

          return { cash, digital, start };
      } catch (e) {
          console.error("Error calculating shift totals", e);
          return { cash: 0, digital: 0, start: 0 };
      }
  }, [activeShift, movements, transactions]);


  // --- Auth Handlers ---
  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    StorageService.saveSession(loggedInUser);

    if (loggedInUser.role === 'admin') {
      setView(ViewState.ADMIN);
    } else {
      setView(ViewState.POS);
      if (loggedInUser.id === 'test-user-demo') {
         setTimeout(() => setShowOnboarding(true), 500);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.clearSession();
    setView(ViewState.POS);
    setCart([]);
  };

  // --- Cart Logic ---
  const addToCart = (product: Product, variantId?: string) => {
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

    let totalCost = 0;
    cart.forEach(item => {
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
      profit: (settings.pricesIncludeTax ? total : (total + tax)) - tax - totalCost,
      shiftId: activeShift.id
    };

    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    StorageService.saveTransaction(transaction);

    const newProducts = products.map(p => {
      const cartItemsForProduct = cart.filter(c => c.id === p.id);
      if (cartItemsForProduct.length === 0) return p;

      let newStock = p.stock;
      let newVariants = p.variants ? [...p.variants] : [];

      cartItemsForProduct.forEach(cItem => {
         if (cItem.selectedVariantId && newVariants.length > 0) {
             newVariants = newVariants.map(v => 
                 v.id === cItem.selectedVariantId ? { ...v, stock: v.stock - cItem.quantity } : v
             );
         } else {
             newStock -= cItem.quantity;
         }
      });
      
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

  // --- Purchase Logic ---
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
              setPurchaseBarcode('');
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

      const updatedProducts = products.map(p => {
          const purchasedItem = purchaseCart.find(i => i.productId === p.id);
          if (purchasedItem) {
              return {
                  ...p,
                  stock: p.stock + purchasedItem.quantity,
                  cost: purchasedItem.cost
              };
          }
          return p;
      });

      setProducts(updatedProducts);
      StorageService.saveProducts(updatedProducts);
      
      const updatedPurchases = [newPurchase, ...purchases];
      setPurchases(updatedPurchases);
      StorageService.savePurchase(newPurchase);

      setPurchaseCart([]);
      setPurchaseSupplier('');
      setPurchaseInvoice('');
      setPurchaseSearchTerm('');
      setPurchaseTab('HISTORY');
  };

  // --- Product Management ---
  const handleSaveProduct = () => {
    if (!currentProduct?.name || currentProduct.price <= 0) return;
    
    let productToSave = { ...currentProduct };

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

  const addVariant = () => {
      if (!variantName || !variantPrice || !currentProduct) return;
      const newVariant: ProductVariant = {
          id: Date.now().toString(),
          name: variantName,
          price: parseFloat(variantPrice),
          stock: parseFloat(variantStock) || 0
      };
      
      const newVariants = [...(currentProduct.variants || []), newVariant];
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
      
      const newTotalStock = newVars.reduce((sum, v) => sum + (v.stock || 0), 0);

      setCurrentProduct({ ...currentProduct, variants: newVars, stock: newTotalStock });
  };

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

  const replenishmentData = useMemo(() => {
      const salesCounts: Record<string, number> = {};
      transactions.forEach(t => {
          t.items.forEach(item => {
              salesCounts[item.id] = (salesCounts[item.id] || 0) + item.quantity;
          });
      });

      return products
          .filter(p => p.stock <= 5) 
          .map(p => ({
              ...p,
              salesVelocity: salesCounts[p.id] || 0
          }))
          .sort((a, b) => b.salesVelocity - a.salesVelocity);
  }, [products, transactions]);


  // --- Cash Management Handlers ---
  const handleCashAction = () => {
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
        startAmount: amountVal || 0, 
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
        amount: amountVal || 0,
        description: 'Apertura de Caja',
        timestamp: new Date().toISOString()
      };
      StorageService.saveMovement(move);
      setMovements([...movements, move]);
    } 
    else if (cashAction === 'CLOSE') {
      if (!activeShift) return;
      
      const systemCash = currentShiftTotals.cash; 
      
      const closedShift: CashShift = {
        ...activeShift,
        endTime: new Date().toISOString(),
        endAmount: amountVal || 0,
        expectedAmount: systemCash,
        status: 'CLOSED',
        totalSalesCash: 0, // Calculated in report
        totalSalesDigital: 0
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
      const salesInShift = transactions.filter(t => t.shiftId === activeShift.id);
      const shiftMoves = movements.filter(m => m.shiftId === activeShift.id);
      setTicketType('REPORT');
      setTicketData({ shift: closedShift, movements: shiftMoves, transactions: salesInShift });
      setShowTicket(true);
    }
    else {
      if (!activeShift) return;
      const move: CashMovement = {
        id: Date.now().toString(),
        shiftId: activeShift.id,
        type: cashAction,
        amount: amountVal || 0,
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
           {/* ... Inventory Code (Same as before) ... */}
           <div className="flex justify-between items-center mb-6">
              <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inventario</h1>
                  <p className="text-slate-500 font-medium">Gestiona tu stock y productos</p>
              </div>
              <div className="flex gap-2">
                 {/* Inventory Header Buttons */}
                 <div className="flex bg-white p-1 rounded-xl border border-slate-200 mr-4">
                     <button 
                        onClick={() => setInventoryTab('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${inventoryTab === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                         Todos
                     </button>
                     <button 
                        onClick={() => setInventoryTab('REPLENISHMENT')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${inventoryTab === 'REPLENISHMENT' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-500 hover:bg-orange-50'}`}
                     >
                         <AlertCircle className="w-4 h-4"/> Reposición
                     </button>
                 </div>
                 <button onClick={exportInventory} className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500"/>
                 </button>
                 <button 
                    onClick={handleNew}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-200 hover:scale-105 transition-all flex items-center gap-2"
                 >
                    <Plus className="w-5 h-5"/> Nuevo
                 </button>
              </div>
           </div>
           
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                 {/* Inventory Table / Replenishment Grid */}
                 {inventoryTab === 'ALL' ? (
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
                                        <button onClick={() => showHistory(p)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"><Eye className="w-4 h-4"/></button>
                                        <button onClick={() => { setCurrentProduct(p); setIsProductModalOpen(true); }} className="p-2 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100"><Edit className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                 ) : (
                     <div className="p-6">
                         {replenishmentData.length === 0 ? <p className="text-center text-slate-400">Todo en orden.</p> : 
                            <div className="grid grid-cols-3 gap-4">{replenishmentData.map(p => <div key={p.id} className="p-4 border rounded-xl">{p.name} - Stock: {p.stock}</div>)}</div>
                         }
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- PURCHASES VIEW (Reception) --- */}
      {view === ViewState.PURCHASES && (
        <div className="h-full flex flex-col p-6 animate-fade-in-up font-sans">
           {/* ... Purchases Code (Same as before) ... */}
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
              </div>
           </div>
           
           <div className="flex-1 overflow-hidden relative">
              {purchaseTab === 'NEW' ? (
                  <div className="h-full grid grid-cols-12 gap-6">
                      {/* Left Panel */}
                      <div className="col-span-4 flex flex-col gap-6">
                          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                              <h3 className="font-bold text-slate-800 text-lg mb-4">Datos del Proveedor</h3>
                              <div className="space-y-4">
                                  <input type="text" placeholder="Proveedor" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={purchaseSupplier} onChange={e => setPurchaseSupplier(e.target.value)}/>
                                  <input type="text" placeholder="Nº Factura" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={purchaseInvoice} onChange={e => setPurchaseInvoice(e.target.value)}/>
                              </div>
                          </div>
                          {/* Search */}
                          <div className="bg-violet-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                              <div className="relative z-10">
                                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ScanBarcode className="w-6 h-6"/> Agregar Productos</h3>
                                  <input type="text" placeholder="Buscar..." className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-violet-200 outline-none" value={purchaseSearchTerm} onChange={e => setPurchaseSearchTerm(e.target.value)}/>
                                  {/* Dropdown results */}
                                  {purchaseSearchTerm && (
                                      <div className="absolute left-6 right-6 mt-2 bg-white rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 text-slate-800">
                                          {filteredProductsForPurchase.map(p => (
                                              <div key={p.id} onClick={() => handleAddToPurchase(p)} className="p-3 hover:bg-slate-50 cursor-pointer text-sm font-bold border-b border-slate-50">{p.name}</div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      {/* Right Panel: List */}
                      <div className="col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                              <h3 className="font-bold text-slate-700">Productos a Ingresar</h3>
                              <div className="text-emerald-600 font-black">{settings.currency}{purchaseCart.reduce((s, i) => s + (i.quantity * i.cost), 0).toFixed(2)}</div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4">
                              {purchaseCart.map(item => (
                                  <div key={item.productId} className="flex justify-between items-center p-3 border-b border-slate-50">
                                      <span className="font-bold">{item.productName}</span>
                                      <div className="flex gap-2">
                                          <input type="number" value={item.quantity} onChange={e => updatePurchaseItem(item.productId, 'quantity', parseFloat(e.target.value))} className="w-16 p-2 bg-slate-50 rounded-lg text-center font-bold"/>
                                          <input type="number" value={item.cost} onChange={e => updatePurchaseItem(item.productId, 'cost', parseFloat(e.target.value))} className="w-20 p-2 bg-slate-50 rounded-lg text-center font-bold"/>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <div className="p-6 border-t"><button onClick={handleConfirmPurchase} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold">Procesar Ingreso</button></div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-white rounded-[2.5rem] shadow-sm p-6 h-full overflow-y-auto">
                      {purchases.map(p => (
                          <div key={p.id} className="p-4 border-b flex justify-between">
                              <div><p className="font-bold">{p.supplier}</p><p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString()}</p></div>
                              <div className="font-black text-emerald-600">{settings.currency}{p.totalCost.toFixed(2)}</div>
                          </div>
                      ))}
                  </div>
              )}
           </div>
        </div>
      )}

      {/* --- CUSTOMERS VIEW & REPORTS & SETTINGS (Standard Impl) --- */}
      {view === ViewState.CUSTOMERS && (
          <div className="p-6 h-full flex flex-col">
              <h1 className="text-3xl font-black mb-6">Clientes</h1>
              <div className="bg-white rounded-3xl p-6 flex-1 shadow-sm border border-slate-100">
                  {customers.length === 0 ? <p className="text-center text-slate-400 mt-10">Sin clientes.</p> : 
                    customers.map(c => <div key={c.id} className="p-4 border-b">{c.name} - {c.phone}</div>)
                  }
                  <button onClick={() => { setCurrentCustomer({id:'', name:'', totalPurchases:0}); setShowCustomerModal(true); }} className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-xl"><Plus/></button>
              </div>
              {showCustomerModal && currentCustomer && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white p-8 rounded-3xl w-96">
                          <h3 className="font-bold text-xl mb-4">Nuevo Cliente</h3>
                          <input className="w-full p-3 bg-slate-50 rounded-xl mb-3" placeholder="Nombre" value={currentCustomer.name} onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})}/>
                          <input className="w-full p-3 bg-slate-50 rounded-xl mb-3" placeholder="Teléfono" value={currentCustomer.phone} onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})}/>
                          <button onClick={() => {
                              const newCust = { ...currentCustomer, id: Date.now().toString() };
                              setCustomers([...customers, newCust]);
                              StorageService.saveCustomers([...customers, newCust]);
                              setShowCustomerModal(false);
                          }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Guardar</button>
                          <button onClick={() => setShowCustomerModal(false)} className="w-full py-3 mt-2 text-slate-500 font-bold">Cancelar</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {view === ViewState.SALES && (
          <div className="p-6 h-full">
              <h1 className="text-3xl font-black mb-6">Reportes</h1>
              <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm"><p className="text-slate-400 font-bold text-xs uppercase">Ventas Hoy</p><h3 className="text-3xl font-black">{settings.currency}{transactions.reduce((s,t) => s + t.total, 0).toFixed(2)}</h3></div>
              </div>
          </div>
      )}

      {view === ViewState.SETTINGS && (
          <div className="p-6 h-full">
              <h1 className="text-3xl font-black mb-6">Configuración</h1>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                      <input className="p-3 bg-slate-50 rounded-xl" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} placeholder="Nombre Tienda"/>
                      <input className="p-3 bg-slate-50 rounded-xl" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} placeholder="Teléfono"/>
                  </div>
                  <button onClick={() => { StorageService.saveSettings(settings); alert("Guardado"); }} className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-bold">Guardar Cambios</button>
              </div>
          </div>
      )}

      {/* --- POS VIEW --- */}
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
           {/* ... (Existing Product Modal Code) ... */}
           {/* Minimal Changes here, reused logic */}
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
               <div className="p-6 border-b"><h2 className="font-bold text-xl">Editar Producto</h2></div>
               <div className="p-8 overflow-y-auto">
                   <input className="w-full p-4 bg-slate-50 rounded-xl mb-4" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} placeholder="Nombre"/>
                   <div className="flex gap-4">
                       <input type="number" className="w-full p-4 bg-slate-50 rounded-xl" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} placeholder="Precio"/>
                       <input type="number" className="w-full p-4 bg-slate-50 rounded-xl" value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: parseFloat(e.target.value)})} placeholder="Stock"/>
                   </div>
               </div>
               <div className="p-6 border-t flex justify-end gap-2">
                   <button onClick={() => setIsProductModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold">Cancelar</button>
                   <button onClick={handleSaveProduct} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Guardar</button>
               </div>
           </div>
        </div>
      )}

      {/* Cash Control Modal - FIXED */}
      {showCashControl && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                 <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-slate-700"/> Control de Caja
                    </h2>
                    <button onClick={() => setShowCashControl(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                     
                     {/* Summary Cards - Only if activeShift exists */}
                     {activeShift ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                             {/* Efectivo Card */}
                             <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 relative overflow-hidden flex flex-col justify-center h-32">
                                <div className="absolute right-0 bottom-0 opacity-20"><Banknote className="w-24 h-24 text-emerald-500"/></div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 tracking-wider">EFECTIVO EN CAJA (TEÓRICO)</p>
                                <h3 className="text-4xl font-black text-emerald-800 tracking-tight relative z-10">
                                    {settings.currency}{currentShiftTotals.cash.toFixed(2)}
                                </h3>
                             </div>

                             {/* Digital Card */}
                             <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 relative overflow-hidden flex flex-col justify-center h-32">
                                <div className="absolute right-0 bottom-0 opacity-20"><Smartphone className="w-24 h-24 text-purple-500"/></div>
                                <p className="text-[10px] font-bold text-purple-600 uppercase mb-1 tracking-wider">VENTAS DIGITALES (YAPE/PLIN)</p>
                                <h3 className="text-4xl font-black text-purple-800 tracking-tight relative z-10">
                                    {settings.currency}{currentShiftTotals.digital.toFixed(2)}
                                </h3>
                             </div>

                             {/* Start Info Card */}
                             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col justify-center items-center text-center h-32 shadow-sm">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">INICIO DE CAJA</p>
                                 <p className="text-3xl font-black text-slate-800">{settings.currency}{currentShiftTotals.start.toFixed(2)}</p>
                                 <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                     {activeShift.startTime ? new Date(activeShift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                 </p>
                             </div>
                        </div>
                     ) : (
                         <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                             <p className="text-slate-500 font-medium">La caja está cerrada. Inicia un turno para ver métricas.</p>
                         </div>
                     )}

                     {/* Action Tabs */}
                     <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                         {!activeShift ? (
                             <button onClick={() => setCashAction('OPEN')} className="flex-1 py-3 rounded-xl font-bold text-sm bg-white text-emerald-600 shadow-sm transition-all uppercase tracking-wide">APERTURA DE CAJA</button>
                         ) : (
                             <>
                                <button onClick={() => setCashAction('IN')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wide ${cashAction === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>INGRESO</button>
                                <button onClick={() => setCashAction('OUT')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wide ${cashAction === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>SALIDA / GASTO</button>
                                <button onClick={() => setCashAction('CLOSE')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wide ${cashAction === 'CLOSE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>CIERRE DE TURNO</button>
                             </>
                         )}
                     </div>

                     {/* Form */}
                     <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm mb-8 relative overflow-hidden">
                         <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-3">
                             {cashAction === 'OPEN' && <><Rocket className="w-6 h-6 text-emerald-600"/> <span className="text-emerald-600">Iniciar Turno</span></>}
                             {cashAction === 'IN' && <><div className="text-2xl">💰</div> <span className="text-emerald-600">Registrar Ingreso Extra</span></>}
                             {cashAction === 'OUT' && <><ArrowUpCircle className="w-6 h-6 text-red-600"/> <span className="text-red-600">Registrar Gasto / Retiro</span></>}
                             {cashAction === 'CLOSE' && <><Lock className="w-6 h-6 text-slate-800"/> <span className="text-slate-800">Cerrar Caja</span></>}
                         </h3>

                         <div className="flex gap-4 items-end">
                             <div className="flex-1">
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Monto</label>
                                 <div className="relative">
                                     <input 
                                        type="number" 
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        className="w-full pl-4 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-800 outline-none font-bold text-2xl text-slate-600 placeholder-slate-300 transition-colors"
                                        placeholder="S/. 0.00"
                                        autoFocus
                                     />
                                 </div>
                             </div>
                             {cashAction !== 'OPEN' && (
                                 <div className="flex-[2]">
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Motivo / Descripción</label>
                                     <input 
                                        type="text" 
                                        value={cashDescription}
                                        onChange={(e) => setCashDescription(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-800 outline-none font-bold text-lg text-slate-600 placeholder-slate-300 transition-colors"
                                        placeholder={cashAction === 'CLOSE' ? 'Observaciones de cierre...' : 'Ej. Pago proveedores'}
                                     />
                                 </div>
                             )}
                             <button 
                                onClick={handleCashAction}
                                className="px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 bg-slate-900 hover:bg-black uppercase tracking-wide text-sm"
                             >
                                 CONFIRMAR
                             </button>
                         </div>
                     </div>
                     
                     {/* Movements History */}
                     {activeShift && (
                         <div>
                             <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><History className="w-4 h-4"/> Historial del Turno</h4>
                             <div className="space-y-3">
                                 {movements.filter(m => m.shiftId === activeShift.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(m => (
                                     <div key={m.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                                         <div className="flex items-center gap-4">
                                             <div className={`p-3 rounded-2xl ${
                                                 m.type === 'OPEN' ? 'bg-blue-100 text-blue-600' :
                                                 m.type === 'IN' ? 'bg-emerald-100 text-emerald-600' :
                                                 m.type === 'OUT' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                             }`}>
                                                 {m.type === 'OPEN' && <Store className="w-5 h-5"/>}
                                                 {m.type === 'IN' && <DollarSign className="w-5 h-5"/>}
                                                 {m.type === 'OUT' && <ArrowUpCircle className="w-5 h-5"/>}
                                                 {m.type === 'CLOSE' && <Lock className="w-5 h-5"/>}
                                             </div>
                                             <div>
                                                 <p className="font-bold text-slate-800 text-sm">{m.description}</p>
                                                 <p className="text-xs text-slate-400 font-mono mt-0.5">{new Date(m.timestamp).toLocaleTimeString()}</p>
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
      
      {/* ... Other modals (Ticket, etc.) remain same ... */}
      {showTicket && ticketData && (
        <Ticket 
           type={ticketType}
           data={ticketData}
           settings={settings}
           onClose={() => setShowTicket(false)}
        />
      )}

    </Layout>
  );
};

export default App;