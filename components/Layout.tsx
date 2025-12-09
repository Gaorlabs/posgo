
import React from 'react';
import { ViewState, StoreSettings, UserProfile } from '../types';
import { ShoppingCart, BarChart3, Settings, Menu, PackagePlus, Users, Package, Rocket, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
  settings: StoreSettings;
  user?: UserProfile;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, settings, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label, isAdmin = false }: { view: ViewState; icon: any; label: string, isAdmin?: boolean }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
          onChangeView(view);
          setIsMobileMenuOpen(false);
        }}
        title={isCollapsed ? label : ''}
        className={`relative group flex items-center px-4 py-3.5 mb-2 rounded-2xl transition-all duration-300 ease-out ${
          isActive
            ? isAdmin 
                ? 'bg-red-600 text-white shadow-lg shadow-red-200 transform scale-[1.02]' 
                : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-200 transform scale-[1.02]'
            : isAdmin 
                ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
                : 'text-slate-500 hover:bg-white hover:shadow-md hover:text-violet-600'
        } ${isCollapsed ? 'justify-center w-14 mx-auto' : 'w-full'}`}
      >
        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'animate-pulse-slow' : 'group-hover:scale-110'} ${!isCollapsed ? 'mr-3' : ''}`} />
        
        {!isCollapsed && (
            <span className="font-semibold tracking-wide truncate transition-opacity duration-300 animate-fade-in">{label}</span>
        )}
        
        {isActive && !isCollapsed && (
            <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-ping" />
        )}
      </button>
    );
  };

  const SectionTitle = ({ label }: { label: string }) => {
      if (isCollapsed) return <div className="h-4 my-2" />;
      return <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-2 animate-fade-in truncate">{label}</div>
  };

  return (
    <div className="flex h-screen bg-[#f0f4f8] font-sans">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 text-violet-600"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 bg-[#f8fafc]/90 backdrop-blur-xl border-r border-white/50 transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) lg:relative
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}
      `}>
        {/* Collapse Toggle Button (Desktop Only) */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-12 z-50 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md items-center justify-center text-violet-600 hover:scale-110 hover:shadow-lg hover:border-violet-300 transition-all"
        >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="h-full flex flex-col p-4">
            {/* Logo Area */}
            <div className={`flex flex-col items-center justify-center mb-6 pt-2 transition-all duration-300 ${isCollapsed ? 'scale-90' : ''}`}>
            {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className={`object-contain mb-3 rounded-2xl shadow-lg transition-all duration-500 ${isCollapsed ? 'h-10 w-10' : 'h-24 w-auto hover:rotate-3'}`} />
            ) : (
                <div className={`bg-white rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl shadow-purple-200/50 animate-float border-4 border-white ring-4 ring-purple-50 relative group cursor-default transition-all duration-300 ${isCollapsed ? 'w-12 h-12 rounded-xl' : 'w-20 h-20'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-[1.8rem] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <Rocket className={`${isCollapsed ? 'w-6 h-6' : 'w-10 h-10'} text-violet-600 relative z-10 transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-500`} strokeWidth={2.5} fill="#ec4899" fillOpacity={0.2} />
                </div>
            )}
            
            {!isCollapsed && (
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 tracking-tight animate-fade-in text-center leading-tight">
                    {user?.storeName || settings.storeName || 'PosGo!'}
                </h1>
            )}
            </div>
            
            <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar">
            
            {user?.role === 'admin' && (
                <>
                   <SectionTitle label="Super Admin" />
                   <NavItem view={ViewState.ADMIN} icon={ShieldAlert} label="Panel Admin" isAdmin={true} />
                </>
            )}

            <SectionTitle label="Ventas" />
            <NavItem view={ViewState.POS} icon={ShoppingCart} label="Punto de Venta" />
            <NavItem view={ViewState.PURCHASES} icon={PackagePlus} label="Recepción" />
            
            <SectionTitle label="Administración" />
            <NavItem view={ViewState.INVENTORY} icon={Package} label="Inventario" />
            <NavItem view={ViewState.CUSTOMERS} icon={Users} label="Clientes" />
            <NavItem view={ViewState.SALES} icon={BarChart3} label="Reportes" />
            
            <SectionTitle label="Sistema" />
            <NavItem view={ViewState.SETTINGS} icon={Settings} label="Configuración" />
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200/60">
                <div onClick={onLogout} className={`bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group transition-all duration-300 cursor-pointer hover:border-red-200 ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
                    {!isCollapsed && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:bg-red-100"></div>
                    )}
                    <div className="flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs ${!isCollapsed ? 'mr-3' : ''}`}>
                            {user?.role === 'admin' ? 'A' : user?.storeName?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <span className="block text-xs font-bold text-slate-700 truncate">{user?.phone || 'Usuario'}</span>
                                <span className="block text-[10px] text-slate-500 font-medium truncate uppercase group-hover:text-red-500">Cerrar Sesión</span>
                            </div>
                        )}
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
