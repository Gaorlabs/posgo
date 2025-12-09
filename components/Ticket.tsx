import React from 'react';
import { Transaction, StoreSettings, CashShift, CashMovement, CartItem } from '../types';

interface TicketProps {
  type: 'SALE' | 'REPORT';
  data: any; // Transaction or Report Data
  settings: StoreSettings;
  onClose: () => void;
}

export const Ticket: React.FC<TicketProps> = ({ type, data, settings, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const renderBranding = () => (
    <div className="mt-6 pt-2 border-t border-slate-200 text-[10px] text-center text-slate-400 font-mono">
      Sistema realizado por GaorSystemPeru
    </div>
  );

  const renderSalesTicket = (t: Transaction) => (
    <>
      <div className="text-center mb-4">
        {/* LOGO IN TICKET */}
        {settings.logo && (
          <img src={settings.logo} alt="Logo" className="w-32 h-auto mx-auto mb-2 grayscale" style={{maxWidth: '60%'}} />
        )}
        <h1 className="text-xl font-bold uppercase">{settings.storeName}</h1>
        <p className="text-xs">RUC: {settings.ruc}</p>
        <p className="text-xs">{settings.address}</p>
        <p className="text-xs">Tel: {settings.phone}</p>
        <div className="border-b border-black my-2 border-dashed"></div>
        <p className="text-xs font-bold">TICKET DE VENTA</p>
        <p className="text-xs">#{t.id.slice(-8)}</p>
        <p className="text-xs">{new Date(t.date).toLocaleString()}</p>
        {t.customerName && <p className="text-xs mt-1">Cliente: {t.customerName}</p>}
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="text-left py-1">Cant.</th>
            <th className="text-left py-1">Desc.</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {t.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 align-top">
                {item.quantity} x {item.name}
                {item.discount && item.discount > 0 ? <div className="text-[10px] italic">- Dsc.</div> : null}
              </td>
              <td className="py-1 text-right align-top">
                {(item.price * item.quantity).toFixed(2)}
                {item.discount && item.discount > 0 ? <div className="text-[10px] italic">-{item.discount.toFixed(2)}</div> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed pt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{settings.currency}{t.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IGV ({(settings.taxRate * 100).toFixed(0)}%):</span>
          <span>{settings.currency}{t.tax.toFixed(2)}</span>
        </div>
        {t.discount > 0 && (
          <div className="flex justify-between font-bold">
            <span>Descuento:</span>
            <span>-{settings.currency}{t.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold mt-2">
          <span>TOTAL:</span>
          <span>{settings.currency}{t.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 text-xs border-t border-black border-dashed pt-2">
        <p className="font-bold mb-1">MÉTODO DE PAGO:</p>
        {t.payments && t.payments.length > 0 ? (
           t.payments.map((p, idx) => (
             <div key={idx} className="flex justify-between uppercase">
               <span>{p.method}</span>
               <span>{settings.currency}{p.amount.toFixed(2)}</span>
             </div>
           ))
        ) : (
           <div className="flex justify-between uppercase">
             <span>{t.paymentMethod}</span>
             <span>{settings.currency}{t.total.toFixed(2)}</span>
           </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs">
        <p>¡Gracias por su compra!</p>
        <p>Conserve este ticket para reclamos.</p>
      </div>
      
      {renderBranding()}
    </>
  );

  const renderReportTicket = (report: { shift: CashShift, movements: CashMovement[], transactions: Transaction[] }) => {
    const { shift, transactions } = report;
    
    // Aggregate items sold
    const itemSummary: Record<string, number> = {};
    transactions.forEach(t => {
      t.items.forEach(i => {
        itemSummary[i.name] = (itemSummary[i.name] || 0) + i.quantity;
      });
    });

    // Calculate split totals
    let cashSales = 0;
    let digitalSales = 0;

    transactions.forEach(t => {
      if (t.payments && t.payments.length > 0) {
        t.payments.forEach(p => {
          if (p.method === 'cash') cashSales += p.amount;
          else digitalSales += p.amount;
        });
      } else {
        if (t.paymentMethod === 'cash') cashSales += t.total;
        else digitalSales += t.total;
      }
    });

    return (
      <>
        <div className="text-center mb-4">
          {settings.logo && (
            <img src={settings.logo} alt="Logo" className="w-32 h-auto mx-auto mb-2 grayscale" style={{maxWidth: '60%'}} />
          )}
          <h1 className="text-xl font-bold uppercase">{settings.storeName}</h1>
          <p className="text-xs">CIERRE DE CAJA (ARQUEO)</p>
          <div className="border-b border-black my-2 border-dashed"></div>
          <p className="text-xs">Apertura: {new Date(shift.startTime).toLocaleString()}</p>
          <p className="text-xs">Cierre: {shift.endTime ? new Date(shift.endTime).toLocaleString() : 'En curso'}</p>
        </div>

        <div className="text-xs space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Fondo Inicial:</span>
            <span>{settings.currency}{shift.startAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>(+) Ventas Efectivo:</span>
            <span>{settings.currency}{cashSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>(+) Ventas Digitales:</span>
            <span>{settings.currency}{digitalSales.toFixed(2)}</span>
          </div>
          <div className="border-t border-black border-dashed my-1"></div>
           <div className="flex justify-between font-bold text-sm">
            <span>TOTAL SISTEMA:</span>
            <span>{settings.currency}{((shift.expectedAmount || 0)).toFixed(2)}</span>
          </div>
           <div className="flex justify-between font-bold text-sm">
            <span>REAL EN CAJA:</span>
            <span>{settings.currency}{((shift.endAmount || 0)).toFixed(2)}</span>
          </div>
           <div className="flex justify-between text-xs mt-1">
            <span>Diferencia:</span>
            <span>{settings.currency}{((shift.endAmount || 0) - (shift.expectedAmount || 0)).toFixed(2)}</span>
          </div>
        </div>

        <div className="border-b border-black border-dashed mb-2"></div>
        <p className="text-xs font-bold mb-2">RESUMEN POR PRODUCTO</p>
        <table className="w-full text-xs">
           <tbody>
             {Object.entries(itemSummary).map(([name, qty]) => (
               <tr key={name}>
                 <td className="py-0.5">{name}</td>
                 <td className="text-right py-0.5">{qty}</td>
               </tr>
             ))}
           </tbody>
        </table>

        <div className="mt-8 text-center text-xs border-t border-black pt-4">
          <p>Firma del Cajero</p>
        </div>

        {renderBranding()}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #ticket-content, #ticket-content * {
              visibility: visible;
            }
            #ticket-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm; /* Standard thermal paper width */
              margin: 0;
              padding: 0;
              box-shadow: none;
              border: none;
            }
            @page {
              size: auto;
              margin: 0mm;
            }
          }
        `}
      </style>
      
      <div className="bg-white w-[350px] max-h-[90vh] flex flex-col rounded-lg shadow-2xl overflow-hidden print:shadow-none print:w-full print:rounded-none">
        
        {/* Screen Header - Hidden on Print */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-slate-700">Vista Previa</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">Cerrar</button>
        </div>

        {/* Ticket Content */}
        <div id="ticket-content" className="p-4 overflow-y-auto bg-white text-black font-mono text-sm leading-tight">
          {type === 'SALE' ? renderSalesTicket(data) : renderReportTicket(data)}
        </div>

        {/* Screen Footer Actions - Hidden on Print */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 print:hidden">
          <button 
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100"
          >
            Cerrar
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-md"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};