import React, { useState, useEffect } from 'react';
import { 
  Rocket, ArrowRight, Smartphone, Lock, CheckCircle, 
  Store, Zap, ShieldCheck, Play, Loader2
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  // --- Estados de la Máquina ---
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'ADMIN_LOGIN'>('PHONE');
  const [authTab, setAuthTab] = useState<'LOGIN' | 'DEMO'>('LOGIN');
  
  // --- Datos del Formulario ---
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  // --- UI & Secretos ---
  const [isLoading, setIsLoading] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  // --- LÓGICA DEL BACKDOOR (MODO DIOS) ---
  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount === 4) {
      // ¡Bingo! Se abre la puerta trasera
      setStep('ADMIN_LOGIN');
      setLogoClicks(0);
    }
  };

  // --- LÓGICA DE USUARIO REGULAR (WhatsApp Style) ---
  const handleSendCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    // Simulamos llamada a API de envío de SMS
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    setTimeout(() => {
      // Simulamos validación exitosa
      // En un SaaS real, aquí Supabase devuelve el usuario
      const isDemoUser = phone.replace(/\s/g, '') === '900100100';
      
      const userProfile: UserProfile = {
        id: isDemoUser ? 'test-user-demo' : `user-${Date.now()}`,
        name: isDemoUser ? 'Mi Tienda Demo' : 'Usuario Nuevo',
        role: 'owner', // Por defecto todos son dueños de su tienda
        storeId: `store-${Date.now()}`
      };
      
      onLogin(userProfile);
    }, 1500);
  };

  // --- LÓGICA DE SUPER ADMIN ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'Luis2021') {
        // Credenciales Maestras Correctas
        setIsLoading(true);
        setTimeout(() => {
            onLogin({
                id: 'super-admin',
                name: 'Super Admin',
                role: 'admin', // Esto activa la vista ViewState.ADMIN en App.tsx
                storeId: 'global'
            });
        }, 1000);
    } else {
        alert("Acceso Denegado: Credenciales incorrectas.");
        setAdminPass('');
    }
  };

  // --- LÓGICA MÁGICA DEL MODO DEMO ---
  const startDemo = () => {
      setAuthTab('DEMO'); // Aseguramos visualmente el tab
      setPhone('900 100 100');
      setIsLoading(true);
      
      // Automatizamos el flujo para que el usuario no tenga que hacer nada
      setTimeout(() => {
          setIsLoading(false);
          setStep('OTP');
          // Auto-llenar OTP visualmente para efecto "wow"
          setTimeout(() => setOtp('123456'), 500);
      }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden relative">
        
        {/* --- FONDO ANIMADO --- */}
        <div className="absolute inset-0 z-0">
            {/* Imagen de fondo de alta calidad: Mercado Latino / Emprendedores */}
            <img 
                src="https://images.unsplash.com/photo-1556740758-90de2929e759?q=80&w=2070&auto=format&fit=crop" 
                alt="Emprendedores" 
                className="w-full h-full object-cover opacity-10"
            />
            {/* Blobs Animados (Manchas de color flotantes) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/30 rounded-full blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-400/30 rounded-full blur-[100px] animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        {/* --- CONTENEDOR PRINCIPAL (SPLIT SCREEN) --- */}
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 z-10 h-screen p-6 lg:p-12 gap-12">
            
            {/* IZQUIERDA: BRANDING & INSPIRACIÓN (Solo Desktop) */}
            <div className="hidden lg:flex flex-col justify-center relative">
                <div className="relative z-10 space-y-8 p-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm animate-fade-in-up">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-bold text-slate-700">El Sistema #1 para PYMES</span>
                    </div>

                    <h1 className="text-7xl font-black text-slate-800 leading-tight tracking-tight animate-fade-in-up" style={{animationDelay: '100ms'}}>
                        Acelera tus <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">Ventas Hoy.</span>
                    </h1>
                    
                    <p className="text-xl text-slate-500 max-w-lg leading-relaxed animate-fade-in-up" style={{animationDelay: '200ms'}}>
                        Gestiona inventario, ventas y clientes en un solo lugar. 
                        Sin instalaciones complejas. <b>Todo en la nube.</b>
                    </p>

                    <div className="grid grid-cols-2 gap-4 max-w-md animate-fade-in-up" style={{animationDelay: '300ms'}}>
                        <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Zap className="w-6 h-6"/></div>
                            <div>
                                <p className="font-bold text-slate-800">Rápido</p>
                                <p className="text-xs text-slate-500">Ventas en segundos</p>
                            </div>
                        </div>
                        <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><ShieldCheck className="w-6 h-6"/></div>
                            <div>
                                <p className="font-bold text-slate-800">Seguro</p>
                                <p className="text-xs text-slate-500">Datos encriptados</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DERECHA: FORMULARIO FLOTANTE (Glassmorphism) */}
            <div className="flex items-center justify-center">
                <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl shadow-indigo-200/50 border border-white relative overflow-hidden animate-fade-in-up">
                    
                    {/* Header con Backdoor */}
                    <div className="flex justify-between items-center mb-8">
                        <div 
                            className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none"
                            onClick={handleLogoClick}
                        >
                            {step === 'ADMIN_LOGIN' ? <Lock className="w-6 h-6"/> : <Rocket className="w-6 h-6"/>}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">PosGo!</h2>
                    </div>

                    {step === 'ADMIN_LOGIN' ? (
                        // --- VISTA SECRETA ADMIN ---
                        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-inner animate-bounce-slight">
                            <h3 className="font-bold text-lg mb-2 text-red-400 flex items-center gap-2"><Lock className="w-5 h-5"/> Modo Super Admin</h3>
                            <p className="text-slate-400 text-sm mb-4">Ingresa la llave maestra para acceder al panel de control global.</p>
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <input 
                                    type="password" 
                                    autoFocus
                                    placeholder="Contraseña Maestra"
                                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl focus:border-red-500 outline-none text-white font-mono placeholder-slate-600 transition-all"
                                    value={adminPass}
                                    onChange={(e) => setAdminPass(e.target.value)}
                                />
                                <button disabled={isLoading} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all">
                                    {isLoading ? 'Desbloqueando...' : 'Acceder'}
                                </button>
                                <button type="button" onClick={() => setStep('PHONE')} className="w-full py-2 text-slate-500 text-sm hover:text-white transition-colors">Cancelar</button>
                            </form>
                        </div>
                    ) : (
                        // --- VISTA NORMAL (CLIENTE) ---
                        <>
                            {/* Pestañas (Tabs) */}
                            <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8">
                                <button 
                                    onClick={() => { setAuthTab('LOGIN'); setStep('PHONE'); }}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authTab === 'LOGIN' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Ingresar
                                </button>
                                <button 
                                    onClick={() => setAuthTab('DEMO')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authTab === 'DEMO' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Modo Demo
                                </button>
                            </div>

                            {authTab === 'DEMO' ? (
                                // --- CONTENIDO TAB DEMO ---
                                <div className="space-y-6 text-center animate-fade-in">
                                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Play className="w-10 h-10 text-pink-500 ml-1"/>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">¡Prueba PosGo! Gratis</h3>
                                    <p className="text-slate-500 text-sm">
                                        Explora todas las funciones premium con datos de prueba pre-cargados. Sin compromiso.
                                    </p>
                                    
                                    <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Credenciales de Prueba</p>
                                        <div className="flex justify-between items-center">
                                            <span className="font-mono text-slate-600 font-bold">900 100 100</span>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold">Activo</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={startDemo}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <><Rocket className="w-5 h-5"/> Iniciar Demo Ahora</>}
                                    </button>
                                </div>
                            ) : (
                                // --- CONTENIDO TAB LOGIN ---
                                <div className="animate-fade-in">
                                    {step === 'PHONE' && (
                                        <form onSubmit={handleSendCode} className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-2">Número de Celular</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-slate-200 pr-3">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Peru.svg" alt="PE" className="w-5 h-auto rounded-sm shadow-sm"/>
                                                        <span className="font-bold text-slate-600 text-sm">+51</span>
                                                    </div>
                                                    <input 
                                                        type="tel" 
                                                        placeholder="900 000 000"
                                                        className="w-full pl-[5.5rem] pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-lg text-slate-800 transition-all placeholder-slate-300"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                disabled={isLoading || !phone}
                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:transform-none transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <><Smartphone className="w-5 h-5"/> Enviar Código</>}
                                            </button>
                                        </form>
                                    )}

                                    {step === 'OTP' && (
                                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in-up">
                                            <div className="text-center mb-6">
                                                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                                                    <Smartphone className="w-6 h-6"/>
                                                </div>
                                                <h3 className="font-bold text-slate-800">Verifica tu número</h3>
                                                <p className="text-sm text-slate-500">Enviamos un código al <b>{phone}</b></p>
                                            </div>

                                            <div>
                                                <input 
                                                    type="text" 
                                                    maxLength={6}
                                                    placeholder="000 000"
                                                    className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none font-mono text-3xl text-center tracking-widest text-indigo-600 transition-all"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>

                                            <button 
                                                disabled={isLoading || otp.length < 4}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <><CheckCircle className="w-5 h-5"/> Validar Acceso</>}
                                            </button>
                                            
                                            <button 
                                                type="button" 
                                                onClick={() => setStep('PHONE')}
                                                className="w-full py-2 text-slate-400 text-xs font-bold hover:text-indigo-600 transition-colors"
                                            >
                                                Cambiar número
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};