
import React, { useState } from 'react';
import { Rocket, ArrowRight, Loader2, Lock, TrendingUp, Package, CheckCircle2, Sparkles, PlayCircle, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'ADMIN_LOGIN'>('PHONE');
  const [authTab, setAuthTab] = useState<'LOGIN' | 'DEMO'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 4) {
      setStep('ADMIN_LOGIN');
      setLogoClicks(0);
    }
  };

  const handleSendCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Strip spaces for length check
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 9) return alert('Número inválido');
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
    }, 1500);
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    // TEST USER LOGIC
    if (phone.replace(/\s/g, '') === '900100100') {
        setTimeout(() => {
            const testUser: UserProfile = {
                id: 'test-user-demo',
                phone: '900 100 100',
                storeName: 'Mi Tienda Demo 🚀',
                role: 'owner',
                plan: 'pro',
                planExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                isBlocked: false,
                onboarded: true
            };
            onLogin(testUser);
            setIsLoading(false);
        }, 1000);
        return;
    }

    // Normal User Logic (Mock for now, ready for Supabase Auth integration)
    setTimeout(() => {
      const mockUser: UserProfile = {
        id: 'user-' + Date.now(),
        phone: phone,
        storeName: 'Mi Negocio',
        role: 'owner',
        plan: 'pro',
        planExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        onboarded: true
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass !== 'Luis2021') { 
      alert('Contraseña incorrecta');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const adminUser: UserProfile = {
        id: 'admin-001',
        phone: '000000000',
        storeName: 'PosGo! Admin',
        role: 'admin',
        plan: 'enterprise',
        planExpiryDate: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        onboarded: true
      };
      onLogin(adminUser);
      setIsLoading(false);
    }, 1000);
  };

  const startDemo = () => {
      // Fix: Directly set phone and trigger next step to avoid state update race condition
      setPhone('900100100'); 
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setStep('OTP');
      }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans relative overflow-hidden">
      
      {/* Background with Fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-slate-100 z-0"></div>
      <img 
        src="https://images.unsplash.com/photo-1604594849809-dfedbc82710f?q=80&w=2670&auto=format&fit=crop" 
        alt="Mercado Peruano" 
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay z-0 filter blur-[1px]"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
      />
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float" style={{animationDelay: '4s'}}></div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/50 flex overflow-hidden relative z-10 mx-4 lg:mx-0 min-h-[600px]">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex w-1/2 bg-white/40 p-12 flex-col justify-between relative border-r border-white/50">
           <div className="relative z-10">
              <div 
                className="flex items-center gap-3 mb-8 cursor-pointer select-none group"
                onClick={handleLogoClick}
                title="PosGo! System"
              >
                  <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-violet-200 animate-bounce-slight group-active:scale-95 transition-transform">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-black text-2xl text-slate-800 tracking-tight">PosGo!</span>
              </div>
              
              <h1 className="text-5xl font-black text-slate-800 leading-tight mb-6 animate-fade-in-up">
                Acelera tus <span className="text-violet-600">Ventas</span>,<br/>
                controla tu <span className="text-pink-500">Stock</span><br/>
                y crece <span className="text-emerald-500">Sin Límites.</span>
              </h1>
              
              <p className="text-slate-600 text-lg font-medium max-w-md leading-relaxed animate-fade-in-up" style={{animationDelay: '200ms'}}>
                Olvídate del cuaderno y el desorden. Únete a los emprendedores que ya digitalizaron su negocio con alegría. 🚀
              </p>
           </div>

           {/* Floating Icons */}
           <div className="absolute right-10 top-20 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-emerald-500 animate-bounce-slight border border-slate-100 z-0 opacity-80">
              <TrendingUp className="w-8 h-8"/>
           </div>
           <div className="absolute right-20 bottom-40 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-violet-500 animate-float border border-slate-100 opacity-80">
               <Package className="w-10 h-10"/>
           </div>
           
           <div className="relative z-10 flex flex-wrap gap-4 mt-8 animate-fade-in-up" style={{animationDelay: '400ms'}}>
               <div className="px-5 py-3 bg-white/80 backdrop-blur-md shadow-sm border border-emerald-100 rounded-full text-emerald-700 text-sm font-bold flex items-center gap-2 transform hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500"/> Fácil de Usar
               </div>
               <div className="px-5 py-3 bg-white/80 backdrop-blur-md shadow-sm border border-violet-100 rounded-full text-violet-700 text-sm font-bold flex items-center gap-2 transform hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-violet-500"/> Todo en la Nube
               </div>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-white/80 backdrop-blur-xl transition-all">
           <div className="max-w-md mx-auto w-full">
              
              {/* Mobile Header */}
              <div className="lg:hidden mb-8 text-center">
                  <div onClick={handleLogoClick} className="inline-block bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-4 rounded-2xl shadow-lg mb-4 cursor-pointer active:scale-95 transition-transform">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">PosGo!</h2>
              </div>

              {step === 'PHONE' && (
                <div className="animate-fade-in-up">
                    {/* TABS */}
                    <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8 relative">
                        <button 
                            onClick={() => setAuthTab('LOGIN')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative z-10 ${authTab === 'LOGIN' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Ingresar
                        </button>
                        <button 
                            onClick={() => setAuthTab('DEMO')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative z-10 ${authTab === 'DEMO' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" /> Modo Demo
                            </span>
                        </button>
                    </div>

                    {authTab === 'LOGIN' ? (
                        <div className="animate-fade-in">
                            <h2 className="text-3xl font-black text-slate-800 mb-2 hidden lg:block">¡Hola de nuevo! 👋</h2>
                            <p className="text-slate-500 mb-6 font-medium">Ingresa tu celular para acceder a tu negocio.</p>

                            <form onSubmit={handleSendCode} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Número de Celular</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r border-slate-200 pr-3">
                                            <span className="text-2xl">🇵🇪</span>
                                        </div>
                                        <input 
                                            type="tel" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full pl-20 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-violet-500 outline-none font-bold text-xl text-slate-800 transition-all placeholder-slate-300 group-hover:bg-white focus:bg-white focus:ring-4 focus:ring-violet-50" 
                                            placeholder="900 000 000"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={isLoading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : (
                                        <>
                                            <span>Enviar Código</span>
                                            <ArrowRight className="w-5 h-5"/>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-100 rounded-[2rem] p-6 text-center shadow-lg shadow-violet-100/50">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce-slight">
                                    <Sparkles className="w-8 h-8 text-violet-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Prueba PosGo! Gratis</h2>
                                <p className="text-slate-600 font-medium text-sm mb-6 leading-relaxed">
                                    Explora todas las funciones Premium sin registrarte. Usaremos un usuario de prueba automático.
                                </p>
                                
                                <div className="bg-white p-4 rounded-xl border border-slate-100 mb-6 text-left shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Credenciales de Acceso</p>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Smartphone className="w-4 h-4 text-violet-500" />
                                        <span className="font-mono font-bold text-slate-700">900 100 100</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-4 h-4 text-violet-500" />
                                        <span className="font-mono font-bold text-slate-700">****** (Cualquiera)</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={startDemo}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : (
                                        <>
                                            <PlayCircle className="w-6 h-6" />
                                            <span>Iniciar Demo Ahora</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              )}

              {step === 'OTP' && (
                  <div className="animate-fade-in-up">
                      <button onClick={() => setStep('PHONE')} className="text-sm font-bold text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 transition-colors">
                          <ArrowRight className="w-4 h-4 rotate-180"/> Corregir número
                      </button>
                      <h2 className="text-3xl font-black text-slate-800 mb-2">Verificación</h2>
                      <p className="text-slate-500 mb-8 font-medium">Ingresa el código mágico enviado a <span className="text-violet-600 font-bold">{phone}</span></p>

                      <form onSubmit={handleVerifyOtp} className="space-y-6">
                          <input 
                            type="number"
                            placeholder="000000"
                            className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 bg-slate-50 border-b-4 border-slate-200 focus:border-violet-500 outline-none text-slate-800 transition-all placeholder-slate-200 rounded-xl focus:bg-white"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.slice(0,6))}
                            autoFocus
                          />
                          
                          {authTab === 'DEMO' && (
                              <p className="text-center text-sm text-violet-600 font-bold bg-violet-50 p-2 rounded-lg animate-pulse">
                                  💡 Tip: Escribe cualquier código (ej. 123456)
                              </p>
                          )}

                          <button 
                              disabled={isLoading || otp.length < 6}
                              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none"
                          >
                              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : 'Validar Código'}
                          </button>
                      </form>
                  </div>
              )}

              {step === 'ADMIN_LOGIN' && (
                  <div className="animate-fade-in-up">
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg"><Lock className="w-5 h-5 text-red-600"/></div>
                        <div>
                            <p className="font-bold text-red-700 text-sm">Modo Dios</p>
                            <p className="text-xs text-red-500">Acceso restringido al Super Admin</p>
                        </div>
                      </div>
                      <form onSubmit={handleAdminLogin} className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Clave Maestra</label>
                              <input 
                                  type="password" 
                                  value={adminPass}
                                  onChange={(e) => setAdminPass(e.target.value)}
                                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-500 outline-none font-bold text-xl text-slate-800 transition-all placeholder-slate-300" 
                                  placeholder="••••••••"
                                  autoFocus
                              />
                          </div>
                          <button 
                              disabled={isLoading}
                              className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all"
                          >
                              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> : 'Entrar al Sistema'}
                          </button>
                          <button type="button" onClick={() => setStep('PHONE')} className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600">Volver al Login</button>
                      </form>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
