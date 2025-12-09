
import React, { useState } from 'react';
import { Rocket, ShoppingCart, Wallet, Package, ArrowRight, X, CheckCircle2 } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "¡Bienvenido a PosGo!",
      description: "Este es el modo demostración. Aquí podrás probar todas las funciones sin miedo a romper nada. Vamos a darte un recorrido rápido.",
      icon: <Rocket className="w-12 h-12 text-violet-600" />,
      color: "bg-violet-50 border-violet-100",
      btnColor: "bg-violet-600 hover:bg-violet-700"
    },
    {
      title: "Tu Punto de Venta (POS)",
      description: "A la izquierda tienes tus categorías y productos. Al centro, la barra de búsqueda y escáner. ¡Todo está diseñado para vender rápido!",
      icon: <Package className="w-12 h-12 text-pink-500" />,
      color: "bg-pink-50 border-pink-100",
      btnColor: "bg-pink-600 hover:bg-pink-700"
    },
    {
      title: "Control de Caja",
      description: "Antes de vender, siempre debes 'Abrir Caja'. El botón está arriba a la derecha. Registra tu sencillo inicial para llevar cuentas claras.",
      icon: <Wallet className="w-12 h-12 text-emerald-500" />,
      color: "bg-emerald-50 border-emerald-100",
      btnColor: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      title: "Carrito Inteligente",
      description: "A la derecha se irán sumando tus ventas. Puedes hacer descuentos, cobrar con Yape/Plin o dividir la cuenta fácilmente.",
      icon: <ShoppingCart className="w-12 h-12 text-indigo-500" />,
      color: "bg-indigo-50 border-indigo-100",
      btnColor: "bg-indigo-600 hover:bg-indigo-700"
    },
    {
      title: "¡Todo Listo!",
      description: "Ya eres un experto. Empieza abriendo tu caja y realizando tu primera venta de prueba. ¡Disfruta la experiencia PosGo!",
      icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
      color: "bg-green-50 border-green-100",
      btnColor: "bg-slate-900 hover:bg-black"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const stepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Background Glow */}
        <div className={`absolute inset-0 blur-3xl opacity-30 rounded-full transform scale-90 ${stepData.color.replace('bg-', 'bg-').replace('border-', 'text-')}`}></div>
        
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden animate-bounce-slight border-4 border-white">
            
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                <div 
                    className={`h-full transition-all duration-500 ${stepData.btnColor}`} 
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
            </div>

            <button onClick={onComplete} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
                <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center pt-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-white ${stepData.color}`}>
                    {stepData.icon}
                </div>
                
                <h3 className="text-3xl font-black text-slate-800 mb-4 leading-tight">
                    {stepData.title}
                </h3>
                
                <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
                    {stepData.description}
                </p>

                <div className="flex items-center gap-2 w-full">
                    {currentStep > 0 && (
                        <button 
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Atrás
                        </button>
                    )}
                    <button 
                        onClick={handleNext}
                        className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 ${stepData.btnColor}`}
                    >
                        {currentStep === steps.length - 1 ? '¡Comenzar!' : 'Siguiente'}
                        {currentStep < steps.length - 1 && <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            
            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-8">
                {steps.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-slate-800' : 'bg-slate-200'}`}
                    ></div>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
};
