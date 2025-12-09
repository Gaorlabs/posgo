
import React, { useState } from 'react';
import { Search, Shield, User, Calendar, CheckCircle, XCircle, MoreVertical, CreditCard, MessageSquare, Globe, Settings, Lock, AlertTriangle, Zap } from 'lucide-react';
import { UserProfile } from '../types';

export const AdminView = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'CONFIG'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dummy data for users
  const [users, setUsers] = useState<UserProfile[]>([
    { id: '1', storeName: 'Bodega Pepito', phone: '999888777', role: 'owner', plan: 'pro', planExpiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), isBlocked: false, onboarded: true },
    { id: '2', storeName: 'Ferretería Juan', phone: '987654321', role: 'owner', plan: 'free', planExpiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isBlocked: false, onboarded: true },
    { id: '3', storeName: 'Restaurante Sabor', phone: '912345678', role: 'owner', plan: 'pro', planExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), isBlocked: true, onboarded: false },
  ]);

  const filteredUsers = users.filter(u => 
    u.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  const handleRenew = (id: string) => {
    setUsers(users.map(u => {
        if (u.id === id) {
            const currentExpiry = new Date(u.planExpiryDate).getTime() > Date.now() ? new Date(u.planExpiryDate) : new Date();
            currentExpiry.setDate(currentExpiry.getDate() + 30);
            return { ...u, plan: 'pro', planExpiryDate: currentExpiry.toISOString(), isBlocked: false };
        }
        return u;
    }));
  };

  const handleBlockToggle = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isBlocked: !u.isBlocked } : u));
  };

  const handleChangePlan = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, plan: u.plan === 'free' ? 'pro' : 'free' } : u));
  };

  return (
    <div className="h-full bg-[#f8fafc] flex flex-col overflow-hidden animate-fade-in font-sans">
       {/* Header - Gaor Style */}
       <div className="bg-white/80 backdrop-blur-md p-6 border-b border-slate-100 z-10 sticky top-0">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 rounded-2xl border border-red-100 shadow-sm animate-bounce-slight">
                      <Shield className="w-6 h-6 text-red-600"/>
                  </div>
                  <div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-800">Panel Super Admin</h1>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Modo Dios Activo</p>
                      </div>
                  </div>
              </div>
              <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => setActiveTab('USERS')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'USERS' ? 'bg-white text-slate-800 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Usuarios</button>
                  <button onClick={() => setActiveTab('CONFIG')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${activeTab === 'CONFIG' ? 'bg-white text-slate-800 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>Configuración</button>
              </div>
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
             
             {activeTab === 'USERS' && (
                <div className="space-y-8">
                   {/* Metrics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-slate-100 transition-colors"></div>
                          <p className="text-xs font-bold text-slate-400 uppercase relative z-10">Usuarios Totales</p>
                          <h3 className="text-5xl font-black text-slate-800 mt-2 relative z-10 tracking-tight">{users.length}</h3>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 rounded-[2rem] shadow-xl shadow-indigo-200 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                          <p className="text-xs font-bold text-indigo-100 uppercase relative z-10">Activos (PRO)</p>
                          <h3 className="text-5xl font-black text-white mt-2 relative z-10 tracking-tight">{users.filter(u => u.plan === 'pro' && !u.isBlocked).length}</h3>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors"></div>
                          <p className="text-xs font-bold text-slate-400 uppercase relative z-10">MRR Estimado</p>
                          <h3 className="text-5xl font-black text-emerald-600 mt-2 relative z-10 tracking-tight">S/ {users.filter(u => u.plan === 'pro').length * 50}</h3>
                      </div>
                   </div>

                   {/* Search & List */}
                   <div className="bg-white rounded-[2.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                       <div className="p-8 border-b border-slate-100 flex gap-4 items-center bg-slate-50/30">
                          <div className="relative flex-1">
                              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                              <input 
                                type="text" 
                                placeholder="Buscar por negocio o teléfono..." 
                                className="w-full pl-14 pr-6 py-4 border-none bg-white rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 outline-none text-slate-700 font-bold transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                       </div>
                       <table className="w-full text-left">
                          <thead className="bg-slate-50/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              <tr>
                                  <th className="p-6 pl-8">Negocio / Dueño</th>
                                  <th className="p-6">Estado Plan</th>
                                  <th className="p-6">Vencimiento</th>
                                  <th className="p-6 text-right">Acciones Rápidas</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {filteredUsers.map(u => {
                                  const isExpired = new Date(u.planExpiryDate).getTime() < Date.now();
                                  return (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-6 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    {u.storeName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg leading-tight">{u.storeName}</div>
                                                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                        <User className="w-3 h-3"/> {u.phone}
                                                        {u.isBlocked && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-lg font-bold border border-red-200">BLOQUEADO</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border ${u.plan === 'pro' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {u.plan}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className={`text-sm font-bold flex items-center gap-2 ${isExpired ? 'text-red-500' : 'text-emerald-600'}`}>
                                                {isExpired ? <AlertTriangle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                                                {new Date(u.planExpiryDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium ml-6">
                                                {isExpired ? 'Servicio Suspendido' : 'Servicio Activo'}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleRenew(u.id)} title="Renovar 30 días" className="p-3 bg-white border border-slate-200 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:scale-105 transition-all shadow-sm">
                                                    <Calendar className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleChangePlan(u.id)} title="Cambiar Plan" className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:scale-105 transition-all shadow-sm">
                                                    <CreditCard className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleBlockToggle(u.id)} title={u.isBlocked ? "Desbloquear" : "Bloquear"} className={`p-3 border rounded-xl transition-all hover:scale-105 shadow-sm ${u.isBlocked ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200'}`}>
                                                    {u.isBlocked ? <CheckCircle className="w-5 h-5"/> : <Lock className="w-5 h-5"/>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                  );
                              })}
                          </tbody>
                       </table>
                   </div>
                </div>
             )}

             {activeTab === 'CONFIG' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sales Contact */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-green-100 rounded-2xl"><MessageSquare className="w-6 h-6 text-green-600"/></div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">Contacto de Ventas</h3>
                                <p className="text-sm text-slate-500">Destino de leads desde Landing</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">WhatsApp Business (Soporte/Ventas)</label>
                            <input type="text" defaultValue="51999888777" className="w-full p-4 bg-white rounded-xl font-bold text-slate-800 outline-none border-2 border-slate-100 focus:border-green-500 transition-colors"/>
                        </div>
                        <button className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">Guardar Cambios</button>
                    </div>

                    {/* Landing Page */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-100 rounded-2xl"><Globe className="w-6 h-6 text-blue-600"/></div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">Landing Page</h3>
                                <p className="text-sm text-slate-500">Enlaces públicos y redes</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Facebook</label>
                                    <input type="text" defaultValue="posgo.pe" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:bg-white focus:border-blue-200 transition-all font-medium text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Instagram</label>
                                    <input type="text" defaultValue="@posgo_peru" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:bg-white focus:border-pink-200 transition-all font-medium text-sm"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Correo de Soporte</label>
                                <input type="email" defaultValue="hola@posgo.com" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:bg-white focus:border-slate-200 transition-all font-medium text-sm"/>
                            </div>
                        </div>
                        <button className="w-full px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">Actualizar Web</button>
                    </div>

                    {/* Payment Gateway Section (NEW) */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10"><CreditCard className="w-6 h-6 text-indigo-300"/></div>
                            <div>
                                <h3 className="font-bold text-xl text-white">Pasarela de Pagos</h3>
                                <p className="text-sm text-slate-400">Integración con MercadoPago (Futuro)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Public Key</label>
                                <div className="relative">
                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                    <input type="text" placeholder="TEST-..." className="w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all font-mono text-sm"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Access Token</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                    <input type="password" placeholder="TEST-..." className="w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all font-mono text-sm"/>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end relative z-10">
                             <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/50 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4"/> Guardar Credenciales
                             </button>
                        </div>
                    </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
