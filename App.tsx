import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, Product, CartItem, Transaction, StoreSettings, Purchase, PurchaseItem, PaymentMethod, PaymentDetail, Customer, CashShift, CashMovement, Supplier } from './types';
import { StorageService } from './services/storageService';
import { Layout } from './components/Layout';
import { Cart } from './components/Cart';
import { Ticket } from './components/Ticket';
import { DEFAULT_SETTINGS, CATEGORIES } from './constants';
import { 
  Search, Plus, Edit, Trash2, TrendingUp, DollarSign, Package, Download,
  Save, Loader2, AlertTriangle, ScanBarcode, ShoppingBag, History, CheckCircle,
  X, Users, UserPlus, Phone, Mail, FileText, BadgePercent, Lock, Unlock,
  Printer, ArrowUpCircle, ArrowDownCircle, Wallet, ChevronLeft, LogOut, ArrowRightLeft,
  Upload, FileSpreadsheet, Filter, Calendar, CreditCard, PieChart as PieChartIcon,
  List, CalendarDays, CalendarRange, Store, LayoutGrid, Truck, MapPin, Image as ImageIcon, Zap, Banknote, Smartphone,
  FileDown, FileUp, Eye, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.POS);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  
  // Cash & Shift State
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  
  // Ticket State
  const [ticketData, setTicketData] = useState<{type: 'SALE' | 'REPORT', data: any} | null>(null);

  // Loading State
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Data
  useEffect(() => {
    setProducts(StorageService.getProducts());
    setTransactions(StorageService.getTransactions());
    setPurchases(StorageService.getPurchases());
    setCustomers(StorageService.getCustomers());
    setSuppliers(StorageService.getSuppliers());
    setSettings(StorageService.getSettings());
    setShifts(StorageService.getShifts());
    setMovements(StorageService.getMovements());
    setCurrentShiftId(StorageService.getActiveShiftId());
    setIsLoaded(true);
  }, []);

  const activeShift = useMemo(() => shifts.find(s => s.id === currentShiftId), [shifts, currentShiftId]);

  // Handlers
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, discount: 0 }];
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateDiscount = (id: string, discount: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, discount } : item));
  };

  const handleCheckout = (primaryMethod: PaymentMethod, payments: PaymentDetail[], customerId?: string, globalDiscount: number = 0) => {
    if (!activeShift) {
      alert("Debe abrir la caja antes de realizar ventas.");
      setIsCashModalOpen(true);
      return;
    }

    const lineTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const itemDiscounts = cart.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
    const totalDiscount = itemDiscounts + globalDiscount;
    const netAmount = Math.max(0, lineTotal - totalDiscount);

    let tax = 0;
    let subtotal = 0;
    let total = 0;

    if (settings.pricesIncludeTax) {
        total = netAmount;
        subtotal = total / (1 + settings.taxRate);
        tax = total - subtotal;
    } else {
        subtotal = netAmount;
        tax = subtotal * settings.taxRate;
        total = subtotal + tax;
    }

    const costTotal = cart.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0);
    const revenueNoTax = settings.pricesIncludeTax ? subtotal : subtotal; 
    const profit = Math.max(0, revenueNoTax - costTotal);

    const customer = customers.find(c => c.id === customerId);

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      tax,
      discount: totalDiscount,
      total,
      paymentMethod: primaryMethod,
      payments: payments,
      customerId,
      customerName: customer?.name,
      profit,
      shiftId: activeShift.id
    };

    if (customerId && customer) {
      const updatedCustomers = customers.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            totalPurchases: c.totalPurchases + 1,
            lastPurchaseDate: new Date().toISOString()
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      StorageService.saveCustomers(updatedCustomers);
    }

    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    StorageService.saveTransaction(transaction);
    
    const newProducts = products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.quantity };
      }
      return p;
    });
    setProducts(newProducts);
    StorageService.saveProducts(newProducts);

    setCart([]);
    setTicketData({ type: 'SALE', data: transaction });
  };

  const handleOpenShift = (amount: number) => {
    const newShift: CashShift = { id: Date.now().toString(), startTime: new Date().toISOString(), startAmount: amount, status: 'OPEN', totalSalesCash: 0, totalSalesDigital: 0 };
    setShifts([newShift, ...shifts]); StorageService.saveShift(newShift); setCurrentShiftId(newShift.id); StorageService.setActiveShiftId(newShift.id);
    const movement: CashMovement = { id: Date.now().toString(), shiftId: newShift.id, type: 'OPEN', amount: amount, description: 'Apertura de Caja', timestamp: new Date().toISOString() };
    setMovements([...movements, movement]); StorageService.saveMovement(movement);
  };
  
  const handleCloseShift = (endAmount: number) => {
    if (!activeShift) return;
    const shiftTx = transactions.filter(t => t.shiftId === activeShift.id);
    let cashSales = 0; let digitalSales = 0;
    shiftTx.forEach(t => { if (t.payments && t.payments.length > 0) { t.payments.forEach(p => { if (p.method === 'cash') cashSales += p.amount; else digitalSales += p.amount; }); } else { if (t.paymentMethod === 'cash') cashSales += t.total; else digitalSales += t.total; } });
    const shiftMovements = movements.filter(m => m.shiftId === activeShift.id); const cashIn = shiftMovements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.amount, 0); const cashOut = shiftMovements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.amount, 0);
    const expected = activeShift.startAmount + cashSales + cashIn - cashOut;
    const closedShift: CashShift = { ...activeShift, endTime: new Date().toISOString(), status: 'CLOSED', endAmount, expectedAmount: expected, totalSalesCash: cashSales, totalSalesDigital: digitalSales };
    setShifts(shifts.map(s => s.id === activeShift.id ? closedShift : s)); StorageService.saveShift(closedShift);
    const movement: CashMovement = { id: Date.now().toString(), shiftId: activeShift.id, type: 'CLOSE', amount: endAmount, description: 'Cierre de Caja', timestamp: new Date().toISOString() };
    setMovements([...movements, movement]); StorageService.saveMovement(movement);
    setCurrentShiftId(null); StorageService.setActiveShiftId(null); setIsCashModalOpen(false);
    setTicketData({ type: 'REPORT', data: { shift: closedShift, movements: shiftMovements, transactions: shiftTx } });
  };
  
  const handleCashMovement = (type: 'IN' | 'OUT', amount: number, reason: string) => {
    if (!activeShift) return;
    const movement: CashMovement = { id: Date.now().toString(), shiftId: activeShift.id, type, amount, description: reason, timestamp: new Date().toISOString() };
    setMovements([...movements, movement]); StorageService.saveMovement(movement);
  };

  if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12"/></div>;

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView} settings={settings}>
      
      {currentView === ViewState.POS && (
        <div className="bg-white/70 backdrop-blur-md border-b border-white/50 px-6 py-4 flex justify-between items-center shadow-sm z-20 relative animate-fade-in-up">
           <div className="flex items-center gap-4">
             <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
             <div className="flex flex-col">
               <span className={`font-black text-sm uppercase tracking-wider ${activeShift ? 'text-emerald-700' : 'text-red-600'}`}>
                 {activeShift ? 'Caja Abierta' : 'Caja Cerrada'}
               </span>
               {activeShift && <span className="text-xs text-slate-500 font-medium">Turno #{activeShift.id.slice(-4)}</span>}
             </div>
           </div>
           
           <button 
             onClick={() => setIsCashModalOpen(true)}
             className={`
               group flex items-center gap-3 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0
               ${activeShift 
                 ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white ring-2 ring-slate-100' 
                 : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white ring-4 ring-emerald-100 animate-pulse-slow'
               }
             `}
           >
             <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" />
             {activeShift ? 'Control Caja' : 'Iniciar Turno'}
           </button>
        </div>
      )}

      {currentView === ViewState.POS && (
        <POSView 
          products={products} 
          cart={cart} 
          onAddToCart={handleAddToCart}
          onUpdateCart={handleUpdateCartQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          onUpdateDiscount={handleUpdateDiscount}
          onCheckout={handleCheckout}
          onClearCart={() => setCart([])}
          settings={settings}
          customers={customers}
          isShiftOpen={!!activeShift}
          onOpenCashControl={() => setIsCashModalOpen(true)}
        />
      )}
      
      {currentView === ViewState.PURCHASES && (
        <PurchasesView
          products={products}
          setProducts={(p: Product[]) => { setProducts(p); StorageService.saveProducts(p); }}
          purchases={purchases}
          setPurchases={(p: Purchase[]) => { setPurchases(p); }}
          suppliers={suppliers}
          setSuppliers={(s: Supplier[]) => { setSuppliers(s); StorageService.saveSuppliers(s); }}
          settings={settings}
        />
      )}
      {currentView === ViewState.INVENTORY && <InventoryView products={products} setProducts={(p: Product[]) => { setProducts(p); StorageService.saveProducts(p); }} settings={settings} transactions={transactions} purchases={purchases} />}
      {currentView === ViewState.SALES && <SalesView transactions={transactions} settings={settings} shifts={shifts} />}
      {currentView === ViewState.CUSTOMERS && <CustomersView customers={customers} setCustomers={(c: Customer[]) => { setCustomers(c); StorageService.saveCustomers(c); }} transactions={transactions} />}
      {currentView === ViewState.SETTINGS && <SettingsView settings={settings} onSave={(s: StoreSettings) => { setSettings(s); StorageService.saveSettings(s); }} />}

      {isCashModalOpen && <CashControlModal isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} activeShift={activeShift} onOpenShift={handleOpenShift} onCloseShift={handleCloseShift} onMovement={handleCashMovement} settings={settings} transactions={transactions} movements={movements} />}
      {ticketData && <Ticket type={ticketData.type} data={ticketData.data} settings={settings} onClose={() => setTicketData(null)} />}

    </Layout>
  );
};

export default App;

const POSView = ({ products, cart, onAddToCart, onUpdateCart, onRemoveFromCart, onUpdateDiscount, onCheckout, onClearCart, settings, customers, isShiftOpen, onOpenCashControl }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barcodeRef.current && isShiftOpen) barcodeRef.current.focus();
  }, [cart.length, isShiftOpen]);

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShiftOpen) return;
    if (!barcodeInput) return;

    const product = products.find((p: Product) => p.barcode === barcodeInput);
    if (product) {
      onAddToCart(product);
      setBarcodeInput('');
    } else {
      alert('Producto no encontrado');
      setBarcodeInput('');
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden">
      {!isShiftOpen && (
        <div className="absolute inset-0 z-30 bg-slate-900/30 backdrop-blur-md flex items-center justify-center animate-fade-in">
           <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md border border-white/50 animate-bounce-slight">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-slate-400" />
             </div>
             <h2 className="text-3xl font-black text-slate-800 mb-2">Caja Cerrada</h2>
             <p className="text-slate-500 mb-8 font-medium">Debe abrir un turno para comenzar a vender.</p>
             <button
                onClick={onOpenCashControl}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
             >
                <Unlock className="w-5 h-5" />
                Abrir Caja Ahora
             </button>
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
        {/* Toolbar */}
        <div className="p-6 pb-2 z-10 space-y-4 animate-fade-in-up">
          <div className="flex gap-4">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
               <button onClick={() => setViewMode('GRID')} className={`p-3 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-5 h-5"/></button>
               <button onClick={() => setViewMode('LIST')} className={`p-3 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleBarcodeSubmit} className="flex-1 shadow-sm rounded-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ScanBarcode className="h-6 w-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" /></div>
                <input ref={barcodeRef} type="text" disabled={!isShiftOpen} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="block w-full pl-12 pr-4 py-4 border-2 border-transparent bg-white rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold shadow-sm" placeholder="Escanear código..." autoFocus />
              </div>
            </form>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                <input type="text" disabled={!isShiftOpen} placeholder="Buscar producto..." className="w-full pl-11 pr-4 py-3 border-none bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar mask-gradient">
               {CATEGORIES.map(cat => (
                   <button 
                    key={cat} 
                    disabled={!isShiftOpen} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all transform hover:scale-105 ${selectedCategory === cat ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' : 'bg-white text-slate-500 hover:bg-white hover:shadow-md'}`}
                   >
                       {cat}
                   </button>
               ))}
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
              {filteredProducts.map((product: Product, index) => (
                <button 
                    key={product.id} 
                    onClick={() => onAddToCart(product)} 
                    disabled={!isShiftOpen || product.stock <= 0} 
                    className="group bg-white p-4 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1.5 duration-300 flex flex-col h-full border border-slate-100 disabled:opacity-60 disabled:cursor-not-allowed animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative group-hover:from-indigo-50 group-hover:to-purple-50 transition-colors">
                     <span className="text-5xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors select-none">{product.name.charAt(0)}</span>
                     <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur-sm ${product.stock < 5 ? 'bg-red-500/10 text-red-600' : 'bg-white/80 text-slate-600'}`}>
                        {product.stock} un.
                     </div>
                     {/* Add Overlay Icon on Hover */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px]">
                        <div className="bg-white p-3 rounded-full shadow-lg text-indigo-600 transform scale-50 group-hover:scale-100 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                     </div>
                  </div>
                  <div className="text-left w-full">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product.category}</p>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between w-full">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                        {settings.currency}{product.price.toFixed(2)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100"><tr><th className="p-4 pl-6">Producto</th><th className="p-4">Stock</th><th className="p-4 text-right">Precio</th><th className="p-4 w-16"></th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredProducts.map((product: Product) => (
                        <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => isShiftOpen && product.stock > 0 && onAddToCart(product)}>
                           <td className="p-4 pl-6"><div className="font-bold text-slate-800">{product.name}</div><div className="text-xs text-slate-400 font-medium">{product.category} • {product.barcode}</div></td>
                           <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded-full font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{product.stock}</span></td>
                           <td className="p-4 text-right font-bold text-indigo-600">{settings.currency}{product.price.toFixed(2)}</td>
                           <td className="p-4"><button disabled={!isShiftOpen || product.stock <= 0} className="p-2 bg-white border border-slate-200 shadow-sm text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all disabled:opacity-50"><Plus className="w-4 h-4" /></button></td>
                        </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
      </div>
      <div className="w-[400px] hidden xl:block h-full relative z-20 shadow-2xl"><Cart items={cart} onUpdateQuantity={onUpdateCart} onRemoveItem={onRemoveFromCart} onUpdateDiscount={onUpdateDiscount} onCheckout={onCheckout} onClearCart={onClearCart} settings={settings} customers={customers} /></div>
    </div>
  );
};

const PurchasesView = ({ products, setProducts, purchases, setPurchases, suppliers, setSuppliers, settings }: any) => {
  const [viewMode, setViewMode] = useState<'new' | 'history' | 'suppliers'>('new');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(CATEGORIES[1]);
  const [newProductPrice, setNewProductPrice] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierHistoryFilter, setSupplierHistoryFilter] = useState<string | null>(null);

  const filteredManualProducts = useMemo(() => {
      if (!manualSearchTerm) return [];
      return products.filter((p: Product) => p.name.toLowerCase().includes(manualSearchTerm.toLowerCase())).slice(0, 5);
  }, [manualSearchTerm, products]);

  const handleBarcodeScan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!barcodeInput) return;
      const product = products.find((p: Product) => p.barcode === barcodeInput);
      if (product) {
      addItemToList(product.id, product.name);
      setBarcodeInput('');
      } else {
      setNewProductBarcode(barcodeInput);
      setIsQuickCreateOpen(true);
      }
  };

  const createNewProduct = () => {
      const newProduct: Product = {
      id: Date.now().toString(),
      name: newProductName,
      barcode: newProductBarcode,
      category: newProductCategory,
      price: parseFloat(newProductPrice) || 0,
      stock: 0,
      description: 'Creado desde Recepción',
      cost: 0
      };
      setProducts([...products, newProduct]);
      setIsQuickCreateOpen(false);
      addItemToList(newProduct.id, newProduct.name);
      setNewProductName(''); setNewProductPrice(''); setBarcodeInput('');
      if(barcodeRef.current) barcodeRef.current.focus();
  };

  const addItemToList = (productId: string, productName: string) => {
      setItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) { return prev; }
      return [...prev, { productId, productName, quantity: 1, cost: 0 }];
      });
      setManualSearchTerm('');
  };

  const updateItem = (productId: string, field: 'quantity' | 'cost', value: number) => {
      setItems(prev => prev.map(item => item.productId === productId ? { ...item, [field]: value } : item));
  };

  const removeItem = (productId: string) => {
      setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const finalizePurchase = () => {
      if (!supplier || !invoiceNumber || items.length === 0) {
      alert('Por favor complete el proveedor, número de factura y agregue items.');
      return;
      }
      const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      const purchase: Purchase = { id: Date.now().toString(), date: new Date().toISOString(), supplier, invoiceNumber, items, totalCost };
      const updatedProducts = products.map((p: Product) => {
      const purchasedItem = items.find(i => i.productId === p.id);
      if (purchasedItem) {
          return { ...p, stock: p.stock + purchasedItem.quantity, cost: purchasedItem.cost };
      }
      return p;
      });
      setProducts(updatedProducts);
      const newPurchases = [purchase, ...purchases];
      setPurchases(newPurchases);
      StorageService.savePurchase(purchase);
      setSupplier(''); setInvoiceNumber(''); setItems([]);
      alert('Compra registrada e inventario actualizado.');
  };

  const handleSaveSupplier = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newSupplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : Date.now().toString(),
      name: formData.get('name') as string,
      ruc: formData.get('ruc') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      contactName: formData.get('contactName') as string,
      };
      if (editingSupplier) {
      setSuppliers(suppliers.map((s: Supplier) => s.id === newSupplier.id ? newSupplier : s));
      } else {
      setSuppliers([...suppliers, newSupplier]);
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
  };

  const filteredPurchases = supplierHistoryFilter ? purchases.filter((p: Purchase) => p.supplier === supplierHistoryFilter) : purchases;

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Recepción de Mercadería</h2>
          <p className="text-slate-500 font-medium">Gestiona proveedores y entradas de stock</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => { setViewMode('new'); setSupplierHistoryFilter(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ viewMode === 'new' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}><Plus className="w-4 h-4"/> Nueva Recepción</button>
           <button onClick={() => { setViewMode('history'); setSupplierHistoryFilter(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ viewMode === 'history' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}><History className="w-4 h-4" /> Historial</button>
           <button onClick={() => setViewMode('suppliers')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${ viewMode === 'suppliers' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}><Truck className="w-4 h-4" /> Proveedores</button>
        </div>
      </div>

      {viewMode === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4 text-lg">Datos del Proveedor</h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Proveedor</label>
                   <input list="suppliersList" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Buscar o escribir..."/>
                   <datalist id="suppliersList">{suppliers.map((s: Supplier) => (<option key={s.id} value={s.name} />))}</datalist>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">N° Factura / Guía</label>
                   <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium font-mono" placeholder="F001-000000"/>
                 </div>
               </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg"><ScanBarcode className="w-6 h-6"/> Agregar Productos</h3>
              <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-indigo-200 uppercase tracking-wide mb-1 block">Escáner</label>
                    <form onSubmit={handleBarcodeScan}>
                        <input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} className="w-full p-3 border-2 border-white/20 bg-white/10 rounded-xl focus:bg-white focus:text-slate-800 outline-none font-mono text-lg placeholder-white/50 text-white transition-all" placeholder="Código..." autoFocus/>
                    </form>
                </div>
                <div className="relative flex items-center justify-center my-4"><div className="border-t border-white/20 w-full absolute"></div><span className="bg-indigo-500 px-2 text-xs text-white/60 relative z-10 font-bold rounded">O BUSCAR</span></div>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 w-5 h-5"/>
                   <input type="text" value={manualSearchTerm} onChange={(e) => setManualSearchTerm(e.target.value)} className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-xl focus:bg-white focus:text-slate-800 outline-none placeholder-indigo-200 text-sm transition-all" placeholder="Nombre del producto..."/>
                   {filteredManualProducts.length > 0 && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-20 overflow-hidden text-slate-800">
                        {filteredManualProducts.map((p: Product) => (
                          <button key={p.id} onClick={() => addItemToList(p.id, p.name)} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm border-b border-slate-50 last:border-0 flex justify-between items-center font-medium">
                            <span>{p.name}</span><span className="text-xs text-slate-400 font-mono">{p.barcode}</span>
                          </button>
                        ))}
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">Productos a Ingresar <span className="text-slate-400 text-sm ml-2">({items.length})</span></h3>
               <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold">Total: {settings.currency}{items.reduce((s, i) => s + (i.cost * i.quantity), 0).toFixed(2)}</div>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
               {items.length === 0 ? (<div className="flex flex-col items-center justify-center h-64 text-slate-300"><ShoppingBag className="w-16 h-16 mb-4 opacity-50"/><p className="text-lg font-medium">Lista vacía</p></div>) : (
                 <table className="w-full text-left">
                   <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50 rounded-lg"><tr><th className="p-3 pl-4 rounded-l-lg">Producto</th><th className="p-3 w-32">Cant.</th><th className="p-3 w-32">Costo</th><th className="p-3 w-32 text-right">Subtotal</th><th className="p-3 w-10 rounded-r-lg"></th></tr></thead>
                   <tbody className="divide-y divide-slate-50">
                       {items.map((item) => (
                           <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 font-bold text-slate-700">{item.productName}</td>
                               <td className="p-4"><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.productId, 'quantity', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"/></td>
                               <td className="p-4"><input type="number" min="0" step="0.01" value={item.cost} onChange={(e) => updateItem(item.productId, 'cost', parseFloat(e.target.value) || 0)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"/></td>
                               <td className="p-4 text-right font-bold text-slate-700">{settings.currency}{(item.quantity * item.cost).toFixed(2)}</td>
                               <td className="p-4 text-right"><button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5"/></button></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
               )}
             </div>
             <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button onClick={finalizePurchase} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-lg"><CheckCircle className="w-6 h-6"/> Procesar Ingreso</button>
             </div>
          </div>
        </div>
      )}

      {viewMode === 'history' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
           {supplierHistoryFilter && (<div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center"><span className="font-bold text-indigo-800">Filtrado por: {supplierHistoryFilter}</span><button onClick={() => setSupplierHistoryFilter(null)} className="text-xs font-bold text-indigo-600 hover:underline">Ver todos</button></div>)}
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm"><tr><th className="p-5 font-bold">Fecha</th><th className="p-5 font-bold">Proveedor</th><th className="p-5 font-bold">Documento</th><th className="p-5 font-bold">Items</th><th className="p-5 font-bold text-right">Total</th></tr></thead>
             <tbody className="divide-y divide-slate-50">{filteredPurchases.map(p => (<tr key={p.id} className="hover:bg-slate-50 transition-colors"><td className="p-5 font-medium">{new Date(p.date).toLocaleDateString()}</td><td className="p-5 text-indigo-600 font-bold">{p.supplier}</td><td className="p-5 font-mono text-sm text-slate-400">{p.invoiceNumber}</td><td className="p-5 text-slate-600">{p.items.length} skus</td><td className="p-5 font-black text-slate-800 text-right">{settings.currency}{p.totalCost.toFixed(2)}</td></tr>))}</tbody>
           </table>
        </div>
      )}

      {viewMode === 'suppliers' && (
        <div className="animate-fade-in-up">
           <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-slate-700">Directorio de Proveedores</h3><button onClick={() => { setEditingSupplier(null); setIsSupplierModalOpen(true); }} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 shadow-lg">+ Nuevo Proveedor</button></div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {suppliers.map((s: Supplier) => (
                <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-4"><div><h4 className="font-bold text-slate-800 text-xl">{s.name}</h4>{s.ruc && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono mt-1 inline-block">RUC: {s.ruc}</span>}</div><button onClick={() => { setEditingSupplier(s); setIsSupplierModalOpen(true); }} className="text-slate-300 hover:text-indigo-600 p-2"><Edit className="w-5 h-5"/></button></div>
                   <div className="space-y-2 text-sm text-slate-500 mb-6">{s.contactName && <div className="flex items-center gap-3"><Users className="w-4 h-4 text-indigo-400"/> {s.contactName}</div>}{s.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-indigo-400"/> {s.phone}</div>}{s.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-indigo-400"/> {s.email}</div>}{s.address && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-indigo-400"/> {s.address}</div>}</div>
                   <button onClick={() => { setSupplierHistoryFilter(s.name); setViewMode('history'); }} className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"><History className="w-4 h-4"/> Ver Historial</button>
                </div>
              ))}
           </div>
        </div>
      )}
      
      {isQuickCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-bounce-slight">
            <div className="p-6 border-b border-slate-100"><h3 className="text-xl font-black text-slate-800">Producto Nuevo</h3><p className="text-sm text-slate-500 mt-1">El código <span className="font-mono bg-yellow-100 px-1 rounded">{newProductBarcode}</span> no existe.</p></div>
            <div className="p-6 space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label><input autoFocus value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none" placeholder="Ej. Coca Cola"/></div>
               <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label><select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none">{CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}</select></div><div><label className="block text-sm font-bold text-slate-700 mb-1">Precio</label><input type="number" step="0.10" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none" /></div></div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4"><button onClick={() => { setIsQuickCreateOpen(false); setBarcodeInput(''); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white">Cancelar</button><button onClick={createNewProduct} disabled={!newProductName || !newProductPrice} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Crear</button></div>
          </div>
        </div>
      )}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
             
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button></div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre</label><input name="name" required defaultValue={editingSupplier?.name} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">RUC</label><input name="ruc" defaultValue={editingSupplier?.ruc} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
               <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Contacto</label><input name="contactName" defaultValue={editingSupplier?.contactName} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div><div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teléfono</label><input name="phone" defaultValue={editingSupplier?.phone} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label><input name="email" type="email" defaultValue={editingSupplier?.email} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
               <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold mt-2 shadow-xl">Guardar Proveedor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CashControlModal = ({ isOpen, onClose, activeShift, onOpenShift, onCloseShift, onMovement, settings, transactions, movements }: any) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [view, setView] = useState('MAIN');
  const [moveType, setMoveType] = useState<'IN'|'OUT'>('IN');

  if (!isOpen) return null;

  // Calculate detailed totals
  const totals = useMemo(() => {
    const acc = { cash: 0, yape: 0, plin: 0, card: 0 };
    if (!activeShift) return acc;
    
    const shiftTx = transactions.filter((t: Transaction) => t.shiftId === activeShift.id);
    
    shiftTx.forEach((t: Transaction) => {
        // Helper to accumulate
        const add = (method: string, amt: number) => {
             if (method === 'cash') acc.cash += amt;
             else if (method === 'yape') acc.yape += amt;
             else if (method === 'plin') acc.plin += amt;
             else if (method === 'card') acc.card += amt;
        };

        if (t.payments && t.payments.length > 0) {
            t.payments.forEach((p: PaymentDetail) => add(p.method, p.amount));
        } else {
            add(t.paymentMethod, t.total);
        }
    });
    return acc;
  }, [activeShift, transactions]);

  const cashIn = activeShift ? movements.filter((m: CashMovement) => m.shiftId === activeShift.id && m.type === 'IN').reduce((sum:number, m:CashMovement) => sum + m.amount, 0) : 0;
  const cashOut = activeShift ? movements.filter((m: CashMovement) => m.shiftId === activeShift.id && m.type === 'OUT').reduce((sum:number, m:CashMovement) => sum + m.amount, 0) : 0;
  
  // What should be in the drawer
  const expectedCash = (activeShift?.startAmount || 0) + totals.cash + cashIn - cashOut;

  // Filter movements for the current shift list
  const shiftMovements = activeShift 
    ? movements
        .filter((m: CashMovement) => m.shiftId === activeShift.id)
        .sort((a: CashMovement, b: CashMovement) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-bounce-slight max-h-[90vh] flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><h3 className="font-black text-xl text-slate-800">Control de Caja</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button></div>
          <div className="p-8 overflow-y-auto custom-scrollbar">
             {!activeShift ? (
                <form onSubmit={(e) => { e.preventDefault(); onOpenShift(parseFloat(amount)); }}>
                   <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><Wallet className="w-8 h-8 text-emerald-600"/></div>
                        <h4 className="font-bold text-slate-700">Apertura de Turno</h4>
                        <p className="text-xs text-slate-400">Ingresa el dinero base en caja</p>
                   </div>
                   <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{settings.currency}</span>
                        <input autoFocus type="number" className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 font-black text-2xl outline-none text-center" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"/>
                   </div>
                   <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200">ABRIR CAJA</button>
                </form>
             ) : view === 'MAIN' ? (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-emerald-100 rounded-xl"><Banknote className="w-5 h-5 text-emerald-600"/></div>
                                 <div><p className="text-xs font-bold text-emerald-800 uppercase">Efectivo Total</p><p className="text-[10px] text-emerald-600 font-medium">(Incluye Caja Chica)</p></div>
                             </div>
                             <span className="font-black text-2xl text-emerald-700">{settings.currency}{expectedCash.toFixed(2)}</span>
                        </div>
                        {totals.yape > 0 && (
                            <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl flex flex-col items-center text-center">
                                <div className="p-1.5 bg-purple-100 rounded-lg mb-1"><Smartphone className="w-4 h-4 text-purple-600"/></div>
                                <span className="text-[10px] font-bold text-purple-400 uppercase">Yape</span>
                                <span className="font-black text-lg text-purple-700">{settings.currency}{totals.yape.toFixed(2)}</span>
                            </div>
                        )}
                        {totals.plin > 0 && (
                            <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-2xl flex flex-col items-center text-center">
                                <div className="p-1.5 bg-cyan-100 rounded-lg mb-1"><Smartphone className="w-4 h-4 text-cyan-600"/></div>
                                <span className="text-[10px] font-bold text-cyan-400 uppercase">Plin</span>
                                <span className="font-black text-lg text-cyan-700">{settings.currency}{totals.plin.toFixed(2)}</span>
                            </div>
                        )}
                        {totals.card > 0 && (
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex flex-col items-center text-center">
                                <div className="p-1.5 bg-blue-100 rounded-lg mb-1"><CreditCard className="w-4 h-4 text-blue-600"/></div>
                                <span className="text-[10px] font-bold text-blue-400 uppercase">Tarjeta</span>
                                <span className="font-black text-lg text-blue-700">{settings.currency}{totals.card.toFixed(2)}</span>
                            </div>
                        )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView('MOVE')} className="py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex flex-col items-center gap-2"><ArrowRightLeft className="w-6 h-6"/>Movimiento</button>
                        <button onClick={() => setView('CLOSE')} className="py-4 bg-red-50 border-2 border-red-100 rounded-2xl font-bold text-red-600 hover:bg-red-100 transition-all flex flex-col items-center gap-2"><LogOut className="w-6 h-6"/>Cerrar Caja</button>
                   </div>
                   
                   {/* Movement History List */}
                   <div className="pt-2">
                       <h5 className="font-bold text-slate-700 mb-3 text-sm uppercase flex items-center gap-2"><History className="w-4 h-4"/> Historial del Turno</h5>
                       <div className="bg-slate-50 rounded-2xl p-2 max-h-48 overflow-y-auto custom-scrollbar space-y-2 border border-slate-100">
                           {shiftMovements.length === 0 ? (
                               <p className="text-center text-xs text-slate-400 py-4 italic">No hay movimientos registrados.</p>
                           ) : (
                               shiftMovements.map((m: CashMovement) => (
                                   <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center animate-fade-in-up">
                                      <div className="flex items-center gap-3">
                                         {m.type === 'IN' && <ArrowUpCircle className="w-8 h-8 text-emerald-500 bg-emerald-50 rounded-full p-1" />}
                                         {m.type === 'OUT' && <ArrowDownCircle className="w-8 h-8 text-red-500 bg-red-50 rounded-full p-1" />}
                                         {(m.type === 'OPEN' || m.type === 'CLOSE') && <Wallet className="w-8 h-8 text-indigo-500 bg-indigo-50 rounded-full p-1" />}
                                         <div>
                                           <p className="font-bold text-sm text-slate-700 leading-tight">{m.description || (m.type === 'OPEN' ? 'Apertura' : m.type === 'CLOSE' ? 'Cierre' : 'Movimiento')}</p>
                                           <p className="text-[10px] text-slate-400 font-medium">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                         </div>
                                      </div>
                                      <span className={`font-black ${m.type === 'OUT' ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {m.type === 'OUT' ? '-' : '+'}{settings.currency}{m.amount.toFixed(2)}
                                      </span>
                                   </div>
                               ))
                           )}
                       </div>
                   </div>
                </div>
             ) : view === 'MOVE' ? (
                <form onSubmit={(e) => { e.preventDefault(); onMovement(moveType, parseFloat(amount), description); setAmount(''); setDescription(''); setView('MAIN'); }}>
                   <div className="flex gap-3 mb-6 p-1 bg-slate-100 rounded-xl">
                       <button type="button" onClick={() => setMoveType('IN')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${moveType === 'IN' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Entrada</button>
                       <button type="button" onClick={() => setMoveType('OUT')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${moveType === 'OUT' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}>Salida</button>
                   </div>
                   <input placeholder="Monto" type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-3 font-bold text-xl outline-none focus:border-indigo-500" value={amount} onChange={e => setAmount(e.target.value)}/>
                   <input placeholder="Motivo (opcional)" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 font-medium outline-none focus:border-indigo-500" value={description} onChange={e => setDescription(e.target.value)}/>
                   <button className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg">Registrar Movimiento</button>
                   <button type="button" onClick={() => setView('MAIN')} className="w-full py-3 mt-2 text-slate-400 font-bold hover:text-slate-600">Volver</button>
                </form>
             ) : (
                <form onSubmit={(e) => { e.preventDefault(); onCloseShift(parseFloat(amount)); }}>
                   <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-sm space-y-2 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700">
                             <span>Efectivo Esperado:</span>
                             <span>{settings.currency}{expectedCash.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-200 my-2"></div>
                        <div className="flex justify-between text-slate-500"><span>Yape:</span><span>{settings.currency}{totals.yape.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Plin:</span><span>{settings.currency}{totals.plin.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Tarjeta:</span><span>{settings.currency}{totals.card.toFixed(2)}</span></div>
                   </div>

                   <div className="text-center mb-4">
                        <h4 className="font-bold text-slate-700">Cierre de Turno</h4>
                        <p className="text-xs text-slate-400">¿Cuánto EFECTIVO hay en caja?</p>
                   </div>
                   <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{settings.currency}</span>
                        <input autoFocus type="number" className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-500 font-black text-2xl outline-none text-center" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"/>
                   </div>
                   <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-200">FINALIZAR TURNO</button>
                   <button type="button" onClick={() => setView('MAIN')} className="w-full py-3 mt-2 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
                </form>
             )}
          </div>
       </div>
    </div>
  );
};

const ProductHistoryModal = ({ product, transactions, purchases, settings, onClose }: any) => {
    // Combine sales and purchases into a single timeline
    const history = useMemo(() => {
        const events: any[] = [];
        
        // Sales
        transactions.forEach((t: Transaction) => {
            const item = t.items.find((i: CartItem) => i.id === product.id);
            if (item) {
                events.push({
                    id: t.id,
                    date: t.date,
                    type: 'SALE',
                    quantity: item.quantity,
                    ref: `#${t.id.slice(-6)}`,
                    detail: 'Venta POS'
                });
            }
        });

        // Purchases
        purchases.forEach((p: Purchase) => {
            const item = p.items.find((i: PurchaseItem) => i.productId === product.id);
            if (item) {
                events.push({
                    id: p.id,
                    date: p.date,
                    type: 'PURCHASE',
                    quantity: item.quantity,
                    ref: p.invoiceNumber || 'S/N',
                    detail: `Ingreso - ${p.supplier}`
                });
            }
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [product, transactions, purchases]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-bounce-slight max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                             <History className="w-5 h-5 text-indigo-500"/> Historial de Producto
                        </h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">{product.name} <span className="text-slate-300 font-light">|</span> <span className="font-mono text-xs bg-slate-200 px-1 rounded">{product.barcode}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {history.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                            <p>No hay movimientos registrados para este producto.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                            {history.map((evt, idx) => (
                                <div key={idx} className="relative pl-6 animate-fade-in-up" style={{animationDelay: `${idx * 50}ms`}}>
                                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${evt.type === 'SALE' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-indigo-100 hover:shadow-md transition-all">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${evt.type === 'SALE' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {evt.type === 'SALE' ? 'Salida' : 'Entrada'}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">{new Date(evt.date).toLocaleString()}</span>
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm">{evt.detail}</p>
                                            <p className="text-xs text-slate-400">Ref: {evt.ref}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xl font-black ${evt.type === 'SALE' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {evt.type === 'SALE' ? '-' : '+'}{evt.quantity}
                                            </span>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Unidades</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 italic">Mostrando últimos {history.length} movimientos de stock calculados.</p>
                </div>
            </div>
        </div>
    );
};

const InventoryView = ({ products, setProducts, settings, transactions, purchases }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'restock'>('all');
  const [minStockThreshold, setMinStockThreshold] = useState(5);
  const [filterCategory, setFilterCategory] = useState('Todos');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const productStats = useMemo(() => {
    const sales: Record<string, number> = {};
    transactions.forEach((t: Transaction) => {
      t.items.forEach(item => {
        sales[item.id] = (sales[item.id] || 0) + item.quantity;
      });
    });
    return sales;
  }, [transactions]);

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      setProducts(products.filter((p: Product) => p.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string),
      description: formData.get('description') as string,
      cost: parseFloat(formData.get('cost') as string) || 0,
    };
    if (editingProduct) {
      setProducts(products.map((p: Product) => p.id === newProduct.id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInventoryBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput) return;
    const found = products.find((p: Product) => p.barcode === scanInput);
    if (found) { setSelectedProductDetail(found); setScanInput(''); } 
    else { alert("Producto no encontrado en inventario"); setScanInput(''); }
  };

  const handleExport = () => {
      const data = products.map((p: Product) => ({
          ID: p.id,
          Nombre: p.name,
          Codigo: p.barcode,
          Categoria: p.category,
          Precio: p.price,
          Costo: p.cost || 0,
          Stock: p.stock,
          ValorTotal: (p.cost || 0) * p.stock
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(wb, `Inventario_PosGo_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImportClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          // Map imported data to Product structure
          const importedProducts: Product[] = data.map((row: any, idx: number) => ({
              id: row.ID ? String(row.ID) : Date.now().toString() + idx,
              name: row.Nombre || 'Sin Nombre',
              barcode: row.Codigo ? String(row.Codigo) : '',
              category: row.Categoria || 'Otros',
              price: parseFloat(row.Precio) || 0,
              cost: parseFloat(row.Costo) || 0,
              stock: parseInt(row.Stock) || 0,
              description: 'Importado'
          }));

          if (confirm(`Se han encontrado ${importedProducts.length} productos. ¿Desea reemplazar el inventario actual (OK) o agregarlos (Cancelar)?`)) {
              setProducts(importedProducts);
          } else {
              setProducts([...products, ...importedProducts]);
          }
          alert("Importación completada con éxito.");
      };
      reader.readAsBinaryString(file);
      e.target.value = ''; // Reset input
  };

  const restockList = products.filter((p: Product) => p.stock <= minStockThreshold).map((p: Product) => ({ ...p, salesCount: productStats[p.id] || 0 })).sort((a: any, b: any) => b.salesCount - a.salesCount);
  const inventoryFiltered = products.filter((p: Product) => {
    const matchesCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchesSearch = !scanInput || (p.name.toLowerCase().includes(scanInput.toLowerCase()) || (p.barcode && p.barcode.includes(scanInput)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
      {/* Hidden File Input for Import */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />

      <div className="mb-8 flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        <div className="w-full xl:w-2/3 flex flex-col md:flex-row gap-4">
           <form onSubmit={handleInventoryBarcodeScan} className="relative flex-1 group"><ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors"/><input ref={scanRef} value={scanInput} onChange={(e) => setScanInput(e.target.value)} className="w-full pl-12 pr-4 py-4 border-none bg-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" placeholder="Escanear producto..."/></form>
           <div className="relative w-full md:w-64"><Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full pl-11 pr-8 py-4 border-none bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium">{CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
             <button onClick={() => setViewMode('all')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'all' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Todo</button>
             <button onClick={() => setViewMode('restock')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'restock' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><AlertTriangle className="w-4 h-4" /> Reponer</button>
           </div>
           {/* Import/Export Actions */}
           <div className="flex gap-2">
               <button onClick={handleExport} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:scale-105 transition-all shadow-sm" title="Exportar Inventario"><FileDown className="w-5 h-5"/></button>
               <button onClick={handleImportClick} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 hover:scale-105 transition-all shadow-sm" title="Importar Inventario"><FileUp className="w-5 h-5"/></button>
           </div>
           
           <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 shadow-lg transform hover:-translate-y-1 transition-all"><Plus className="w-4 h-4" /> Nuevo</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
        <table className="w-full text-left">
           <thead className="bg-slate-50/50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
             <tr>
               <th className="p-5 pl-8">Producto</th>
               <th className="p-5">Stock</th>
               <th className="p-5 text-right">Precio</th>
               <th className="p-5 text-center">Acciones</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {viewMode === 'all' ? inventoryFiltered.map((p: Product) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-5 pl-8">
                    <div className="font-bold text-slate-800 text-lg">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{p.category} • {p.barcode || 'S/C'}</div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stock} un.</span>
                  </td>
                  <td className="p-5 text-right font-black text-indigo-600">{settings.currency}{p.price.toFixed(2)}</td>
                  <td className="p-5 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setHistoryProduct(p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg hover:text-indigo-600" title="Ver Movimientos"><Eye className="w-5 h-5"/></button>
                    <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                  </td>
                </tr>
             )) : restockList.map((p: any) => (
               <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="p-5 pl-8 font-bold text-slate-700">{p.name}</td>
                  <td className="p-5"><span className="text-red-500 font-black">{p.stock}</span> <span className="text-xs text-slate-400">/ min {minStockThreshold}</span></td>
                  <td className="p-5 text-right font-bold text-slate-500">{p.salesCount} vendidos</td>
                  <td className="p-5 text-center"><button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200">Reponer</button></td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-bounce-slight">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3><button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre</label><input name="name" defaultValue={editingProduct?.name} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Código</label><input name="barcode" defaultValue={editingProduct?.barcode} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoría</label><select name="category" defaultValue={editingProduct?.category || CATEGORIES[0]} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Precio</label><input name="price" type="number" step="0.1" defaultValue={editingProduct?.price} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Costo</label><input name="cost" type="number" step="0.1" defaultValue={editingProduct?.cost} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Stock</label><input name="stock" type="number" defaultValue={editingProduct?.stock} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              </div>
              <button className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-xl mt-4">Guardar Producto</button>
            </form>
          </div>
        </div>
      )}

      {historyProduct && (
          <ProductHistoryModal 
            product={historyProduct} 
            transactions={transactions} 
            purchases={purchases} 
            settings={settings}
            onClose={() => setHistoryProduct(null)}
          />
      )}
    </div>
  );
};

const CustomersView = ({ customers, setCustomers, transactions }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustomer: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now().toString(),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      dni: formData.get('dni') as string,
      totalPurchases: editingCustomer ? editingCustomer.totalPurchases : 0,
    };
    if (editingCustomer) {
      setCustomers(customers.map((c: Customer) => c.id === newCustomer.id ? newCustomer : c));
    } else {
      setCustomers([...customers, newCustomer]);
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="h-full p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">Clientes</h2><p className="text-slate-500 font-medium">Gestiona tu base de clientes</p></div>
        <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"><UserPlus className="w-5 h-5"/> Nuevo Cliente</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {customers.map((c: Customer) => (
          <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group animate-fade-in-up">
            <div className="flex items-start justify-between mb-4">
               <div className="w-12 h-12 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">{c.name.charAt(0)}</div>
               <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="text-slate-300 hover:text-indigo-600"><Edit className="w-4 h-4"/></button>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">{c.name}</h3>
            <div className="text-sm text-slate-500 space-y-1 mb-4">
              {c.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {c.phone}</div>}
              {c.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {c.email}</div>}
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400">Compras</span>
              <span className="text-lg font-black text-indigo-600">{c.totalPurchases}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-bounce-slight">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3><button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400"/></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre</label><input name="name" defaultValue={editingCustomer?.name} required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">DNI / RUC</label><input name="dni" defaultValue={editingCustomer?.dni} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teléfono</label><input name="phone" defaultValue={editingCustomer?.phone} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email</label><input name="email" type="email" defaultValue={editingCustomer?.email} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <button className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-xl mt-4">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesView = ({ transactions, settings, shifts }: any) => {
  const totalSales = transactions.reduce((acc: number, t: Transaction) => acc + t.total, 0);
  const totalProfit = transactions.reduce((acc: number, t: Transaction) => acc + (t.profit || 0), 0);
  
  const chartData = transactions.slice(0, 7).reverse().map((t: Transaction) => ({
    name: new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: t.total
  }));

  return (
    <div className="h-full p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
       <div className="mb-8">
         <h2 className="text-3xl font-black text-slate-800 tracking-tight">Reportes de Venta</h2>
         <p className="text-slate-500 font-medium">Análisis de rendimiento y ganancias</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 transform hover:scale-[1.02] transition-transform">
             <div className="flex justify-between items-start mb-4"><div className="p-3 bg-white/20 rounded-2xl"><DollarSign className="w-6 h-6 text-white"/></div><span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-indigo-100">+12% hoy</span></div>
             <p className="text-indigo-100 font-medium mb-1">Ventas Totales</p>
             <h3 className="text-4xl font-black tracking-tight">{settings.currency}{totalSales.toFixed(2)}</h3>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transform hover:scale-[1.02] transition-transform">
             <div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-100 rounded-2xl"><TrendingUp className="w-6 h-6 text-emerald-600"/></div></div>
             <p className="text-slate-400 font-bold uppercase text-xs mb-1">Ganancia Neta</p>
             <h3 className="text-4xl font-black text-slate-800">{settings.currency}{totalProfit.toFixed(2)}</h3>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transform hover:scale-[1.02] transition-transform">
             <div className="flex justify-between items-start mb-4"><div className="p-3 bg-orange-100 rounded-2xl"><ShoppingBag className="w-6 h-6 text-orange-600"/></div></div>
             <p className="text-slate-400 font-bold uppercase text-xs mb-1">Transacciones</p>
             <h3 className="text-4xl font-black text-slate-800">{transactions.length}</h3>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-6">Tendencia de Ventas (Últimas)</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}}/>
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}/>
                   <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={40}/>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <h3 className="font-bold text-slate-800 mb-4">Últimas Transacciones</h3>
             <div className="overflow-y-auto max-h-64 pr-2 custom-scrollbar space-y-3">
               {transactions.slice(0, 10).map((t: Transaction) => (
                 <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <div className="font-bold text-slate-700">#{t.id.slice(-6)}</div>
                      <div className="text-xs text-slate-400">{new Date(t.date).toLocaleTimeString()} • {t.items.length} items</div>
                    </div>
                    <div className="font-black text-indigo-600">{settings.currency}{t.total.toFixed(2)}</div>
                 </div>
               ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const SettingsView = ({ settings, onSave }: any) => {
  const [logoPreview, setLogoPreview] = useState(settings.logo);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSettings: StoreSettings = {
      ...settings,
      storeName: formData.get('storeName') as string,
      ruc: formData.get('ruc') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      currency: formData.get('currency') as string,
      taxRate: parseFloat(formData.get('taxRate') as string) / 100,
      pricesIncludeTax: formData.get('pricesIncludeTax') === 'on',
      logo: logoPreview
    };
    onSave(newSettings);
    alert('Configuración guardada!');
  };

  return (
    <div className="h-full p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in">
       <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configuración</h2>
            <p className="text-slate-500 font-medium">Personaliza tu punto de venta</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-6">
             <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden mb-4 relative group cursor-pointer hover:border-indigo-400 transition-colors">
                   {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain" /> : <ImageIcon className="w-10 h-10 text-slate-300"/>}
                   <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer"/>
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs">Cambiar Logo</div>
                </div>
                <p className="text-xs text-slate-400 font-medium">Click para subir logo</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre Tienda</label><input name="storeName" defaultValue={settings.storeName} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">RUC / NIT</label><input name="ruc" defaultValue={settings.ruc} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Dirección</label><input name="address" defaultValue={settings.address} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teléfono</label><input name="phone" defaultValue={settings.phone} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Moneda (Símbolo)</label><input name="currency" defaultValue={settings.currency} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
             </div>
             
             <div className="p-6 bg-indigo-50 rounded-2xl space-y-4">
               <h4 className="font-bold text-indigo-900">Impuestos y Precios</h4>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-xs font-bold uppercase text-indigo-400 mb-1">Impuesto % (IGV)</label><input name="taxRate" type="number" defaultValue={settings.taxRate * 100} className="w-full p-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                 <div className="flex items-center pt-6">
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input name="pricesIncludeTax" type="checkbox" defaultChecked={settings.pricesIncludeTax} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                     <span className="text-sm font-bold text-indigo-900">Precios incluyen impuestos</span>
                   </label>
                 </div>
               </div>
             </div>

             <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-indigo-300 hover:scale-[1.01] transition-all">Guardar Cambios</button>
          </form>
       </div>
    </div>
  );
};