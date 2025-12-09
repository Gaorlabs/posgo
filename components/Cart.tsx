import React, { useState, useEffect } from 'react';
import { CartItem, StoreSettings, PaymentMethod, PaymentDetail } from '../types';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, Smartphone, X, Check, ArrowRight } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onUpdateDiscount?: (id: string, discount: number) => void;
  onCheckout: (method: PaymentMethod, payments: PaymentDetail[]) => void;
  onClearCart: () => void;
  settings: StoreSettings;
  customers: any[]; 
}

export const Cart: React.FC<CartProps> = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onUpdateDiscount, 
  onCheckout, 
  onClearCart,
  settings 
}) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Multi-payment state
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('cash');
  const [currentAmount, setCurrentAmount] = useState('');
  
  // Math Logic
  const lineTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
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

  // Calculate remaining balance to pay
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = Math.max(0, totalPaid - total);

  // Initialize amount input when modal opens or total changes
  useEffect(() => {
    if (paymentModalOpen) {
      setPayments([]);
      setCurrentMethod('cash');
      setCurrentAmount(total.toFixed(2));
    }
  }, [paymentModalOpen, total]);

  const handleAddPayment = () => {
    const amount = parseFloat(currentAmount);
    if (!amount || amount <= 0) return;

    setPayments([...payments, { method: currentMethod, amount }]);
    
    // Auto-update next input to remaining
    const newPaid = totalPaid + amount;
    const newRemaining = Math.max(0, total - newPaid);
    setCurrentAmount(newRemaining.toFixed(2));
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
    
    // Recalculate remaining for input placeholder
    const currentTotalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    setCurrentAmount((total - currentTotalPaid).toFixed(2));
  };

  const handleFinalize = () => {
    if (remaining > 0.01) { 
      alert("Aún falta cubrir el total.");
      return;
    }
    const primaryMethod = payments.length > 0 ? payments[0].method : 'cash'; 
    onCheckout(primaryMethod, payments);
    setPaymentModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl border-l border-white/50 shadow-2xl rounded-l-3xl overflow-hidden" onClick={() => setSelectedItemId(null)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">Orden Actual</h2>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClearCart(); }}
          className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <ShoppingCart className="w-10 h-10 text-slate-300" />
            </div>
            <p className="font-medium text-lg">Carrito vacío</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
              className={`relative flex items-center justify-between p-4 rounded-2xl shadow-sm cursor-pointer transition-all duration-200 border-2 animate-fade-in-up ${
                selectedItemId === item.id 
                  ? 'bg-indigo-50/50 border-indigo-500 shadow-indigo-100 shadow-md transform scale-[1.02]' 
                  : 'bg-white border-transparent hover:border-slate-100 hover:shadow-md'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex-1">
                <h4 className={`font-bold text-sm leading-tight mb-1 ${selectedItemId === item.id ? 'text-indigo-700' : 'text-slate-800'}`}>{item.name}</h4>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-indigo-600 font-black">
                    {settings.currency}{item.price.toFixed(2)}
                    </p>
                    {item.discount && item.discount > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">-{settings.currency}{item.discount.toFixed(2)}</span>
                    )}
                </div>
                {/* Discount Input when selected */}
                {selectedItemId === item.id && onUpdateDiscount && (
                    <div className="mt-3 flex items-center gap-2 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Descuento</span>
                        <input 
                            type="number"
                            min="0"
                            step="0.10"
                            className="w-20 p-1 text-sm border border-indigo-200 rounded-lg focus:border-indigo-500 outline-none text-center font-bold text-indigo-600 bg-white"
                            placeholder="0.00"
                            value={item.discount || ''}
                            onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
                        />
                    </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center rounded-xl bg-slate-50 p-1 ${selectedItemId === item.id ? 'ring-2 ring-indigo-200' : ''}`}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, -1); }}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-700">{item.quantity}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, 1); }}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:bg-green-50 hover:text-green-500 transition-colors active:scale-90"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${selectedItemId === item.id ? 'bg-red-100 text-red-500' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Totals */}
      <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm text-slate-500 font-medium">
            <span>Subtotal</span>
            <span>{settings.currency}{subtotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
             <div className="flex justify-between text-sm text-red-500 font-bold">
                <span>Descuento</span>
                <span>-{settings.currency}{totalDiscount.toFixed(2)}</span>
             </div>
          )}
          <div className="flex justify-between text-sm text-slate-500 font-medium">
            <span>IGV ({(settings.taxRate * 100).toFixed(0)}%)</span>
            <span>{settings.currency}{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end pt-2">
            <span className="text-slate-800 font-bold text-lg">Total a Pagar</span>
            <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                {settings.currency}{total.toFixed(2)}
            </span>
          </div>
        </div>
        
        <button
          disabled={items.length === 0}
          onClick={(e) => { e.stopPropagation(); setPaymentModalOpen(true); }}
          className="group w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
        >
          <span>Cobrar</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
        </button>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800">Procesar Pago</h3>
               <button onClick={() => setPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* Total Display */}
              <div className="text-center mb-8 relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl rounded-full transform scale-75"></div>
                 <span className="relative text-sm text-slate-500 font-bold uppercase tracking-wide">Total a Pagar</span>
                 <div className="relative text-5xl font-black text-slate-800 tracking-tight mt-1">{settings.currency}{total.toFixed(2)}</div>
              </div>

              {/* Added Payments List */}
              {payments.length > 0 && (
                <div className="mb-6 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pagos Registrados</p>
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-fade-in-up">
                       <span className="uppercase font-bold text-slate-700 flex items-center gap-2">
                         {p.method === 'cash' && <div className="p-1 bg-green-100 rounded-lg"><Banknote className="w-4 h-4 text-green-600"/></div>}
                         {p.method === 'card' && <div className="p-1 bg-blue-100 rounded-lg"><CreditCard className="w-4 h-4 text-blue-600"/></div>}
                         {(p.method === 'yape' || p.method === 'plin') && <div className="p-1 bg-purple-100 rounded-lg"><Smartphone className="w-4 h-4 text-purple-600"/></div>}
                         {p.method}
                       </span>
                       <div className="flex items-center gap-3">
                         <span className="font-mono font-bold text-lg">{settings.currency}{p.amount.toFixed(2)}</span>
                         <button onClick={() => handleRemovePayment(idx)} className="text-red-300 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                       </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-800 mt-2 px-1">
                    <span>Total Abonado</span>
                    <span className="text-green-600">{settings.currency}{totalPaid.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Payment Entry Form */}
              {remaining > 0.01 ? (
                <div className="space-y-5">
                   <div className="grid grid-cols-4 gap-3">
                      {[
                        { id: 'cash', icon: Banknote, label: 'Efectivo', color: 'green' },
                        { id: 'yape', icon: Smartphone, label: 'Yape', color: 'purple' },
                        { id: 'plin', icon: Smartphone, label: 'Plin', color: 'cyan' },
                        { id: 'card', icon: CreditCard, label: 'Tarjeta', color: 'blue' }
                      ].map((m) => (
                        <button 
                            key={m.id}
                            onClick={() => setCurrentMethod(m.id as PaymentMethod)} 
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 text-xs font-bold transition-all duration-200 ${
                                currentMethod === m.id 
                                ? `bg-${m.color}-50 border-${m.color}-500 text-${m.color}-700 shadow-md transform scale-105` 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <m.icon className={`w-6 h-6 ${currentMethod === m.id ? '' : 'grayscale opacity-50'}`}/> 
                            {m.label}
                        </button>
                      ))}
                   </div>

                   <div className="flex gap-3 items-stretch">
                      <div className="relative flex-1 group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">{settings.currency}</span>
                        <input
                          type="number"
                          value={currentAmount}
                          onChange={(e) => setCurrentAmount(e.target.value)}
                          className="w-full pl-10 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-2xl h-full text-slate-800 transition-all"
                          placeholder="0.00"
                          autoFocus
                          onKeyDown={(e) => { if(e.key === 'Enter') handleAddPayment(); }}
                        />
                      </div>
                      <button 
                        onClick={handleAddPayment}
                        className="bg-slate-800 text-white px-6 rounded-2xl font-bold hover:bg-slate-900 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none"
                      >
                        <Plus className="w-6 h-6 mb-1"/>
                        <span>Agregar</span>
                      </button>
                   </div>
                   
                   <p className="text-right text-sm font-medium text-slate-500">
                     Falta por pagar: <span className="font-bold text-red-500 text-lg ml-1">{settings.currency}{remaining.toFixed(2)}</span>
                   </p>
                </div>
              ) : (
                 <div className="bg-green-50 border-2 border-green-100 p-6 rounded-3xl text-center animate-bounce-slight mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-8 h-8 text-green-600"/>
                    </div>
                    <p className="text-green-800 font-black text-xl mb-1">¡Total Cubierto!</p>
                    {change > 0 && <p className="text-green-700 font-medium">Vuelto para el cliente: <span className="text-2xl font-bold block mt-1">{settings.currency}{change.toFixed(2)}</span></p>}
                 </div>
              )}

            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-3.5 px-4 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFinalize}
                disabled={remaining > 0.01}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5"/> Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}