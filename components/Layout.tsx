import React from 'react';
import { ViewState, StoreSettings } from '../types';
import { Store, ShoppingCart, BarChart3, Settings, Menu, PackagePlus, Users, Package, Zap } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
  settings: StoreSettings;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, settings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          onChangeView(view);
          setIsMobileMenuOpen(false);
        }}
        className={`relative group flex items-center w-full px-4 py-3.5 mb-2 rounded-2xl transition-all duration-300 ease-out ${
          isActive
            ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 transform scale-[1.02]'
            : 'text-slate-500 hover:bg-white hover:shadow-md hover:text-indigo-600'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'animate-pulse-slow' : 'group-hover:scale-110'}`} />
        <span className="font-semibold tracking-wide">{label}</span>
        {isActive && (
            <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-ping" />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 text-indigo-600"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#f8fafc]/90 backdrop-blur-xl border-r border-white/50 transform transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
            {/* Logo Area */}
            <div className="flex flex-col items-center justify-center mb-8 pt-2">
            {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className="h-20 w-auto object-contain mb-3 rounded-2xl shadow-lg hover:rotate-3 transition-transform duration-500" />
            ) : (
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-3 shadow-xl shadow-indigo-200 animate-float">
                    <Store className="w-8 h-8 text-white" />
                </div>
            )}
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 tracking-tight">
                {settings.storeName || 'PosGo!'}
            </h1>
            </div>
            
            <nav className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-2">Ventas</div>
            <NavItem view={ViewState.POS} icon={ShoppingCart} label="Punto de Venta" />
            <NavItem view={ViewState.PURCHASES} icon={PackagePlus} label="Recepción" />
            
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-6">Administración</div>
            <NavItem view={ViewState.INVENTORY} icon={Package} label="Inventario" />
            <NavItem view={ViewState.CUSTOMERS} icon={Users} label="Clientes" />
            <NavItem view={ViewState.SALES} icon={BarChart3} label="Reportes" />
            
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-6">Sistema</div>
            <NavItem view={ViewState.SETTINGS} icon={Settings} label="Configuración" />
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200/60">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200/30 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-emerald-300/40"></div>
                    <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
                        <div>
                            <span className="block text-xs font-bold text-emerald-800">Sistema Activo</span>
                            <span className="block text-[10px] text-emerald-600 font-medium">v2.1.0 • GaorSystem</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col w-full bg-[#f0f4f8]">
        {children}
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};