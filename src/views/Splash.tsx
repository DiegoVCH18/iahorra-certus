import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank, MessageSquare, PieChart, ShieldAlert, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    title: "IAhorra CERTUS",
    subtitle: "Educación Financiera del Futuro",
    description: "Tu historia financiera empieza hoy. Aprende a manejar tu dinero de forma fácil y segura.",
    icon: <PiggyBank className="w-20 h-20 text-certus-blue" />
  },
  {
    title: "Aprende con IA",
    subtitle: "Tu mentor personal",
    description: "Resuelve tus dudas financieras 24/7 con nuestro asistente inteligente adaptado a tu edad.",
    icon: <MessageSquare className="w-20 h-20 text-certus-blue" />
  },
  {
    title: "Simula tu Futuro",
    subtitle: "Proyecta tus metas",
    description: "Usa nuestros simuladores para planificar tus ahorros y organizar tu presupuesto mensual.",
    icon: <PieChart className="w-20 h-20 text-certus-blue" />
  },
  {
    title: "Evita Fraudes",
    subtitle: "Navega seguro",
    description: "Aprende a identificar estafas digitales y protege tu dinero con consejos prácticos.",
    icon: <ShieldAlert className="w-20 h-20 text-certus-blue" />
  }
];

export default function Splash() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-certus-blue to-[#1a2e7a] w-full relative overflow-hidden items-center justify-center text-white p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center max-w-sm w-full flex-1 justify-center"
        >
          <div className="bg-white p-6 rounded-3xl mb-8 w-40 h-40 flex items-center justify-center shadow-xl">
            {currentStep === 0 ? (
              <img 
                src="/logo.png" 
                alt="IAhorra CERTUS Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              STEPS[currentStep].icon
            )}
            {currentStep === 0 && <PiggyBank className="text-certus-blue w-16 h-16 hidden" />}
          </div>
          
          <h1 className="font-display text-3xl font-bold mb-2">
            {currentStep === 0 ? (
              <>IAhorra <span className="text-certus-cyan">CERTUS</span></>
            ) : (
              STEPS[currentStep].title
            )}
          </h1>
          
          {currentStep === 0 && (
            <p className="text-xs opacity-80 mb-4 bg-white/10 px-3 py-1 rounded-full">by CERTUS · Licenciado por MINEDU</p>
          )}
          
          <h2 className="text-certus-cyan font-semibold text-lg mb-4">{STEPS[currentStep].subtitle}</h2>
          <p className="text-white/80 leading-relaxed">{STEPS[currentStep].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm flex flex-col gap-6 mt-auto mb-8">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-certus-cyan' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>

        <button 
          onClick={nextStep}
          className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {currentStep === STEPS.length - 1 ? 'COMENZAR AHORA' : 'SIGUIENTE'}
          {currentStep < STEPS.length - 1 && <ArrowRight size={20} />}
        </button>
        
        {currentStep === 0 && (
          <button 
            onClick={() => navigate('/login')}
            className="w-full text-white underline text-sm hover:text-certus-cyan transition-colors"
          >
            Ya tengo cuenta
          </button>
        )}
        
        {currentStep === 0 && (
          <p className="text-center text-[10px] text-white/60 mt-2">
            <a href="https://www.linkedin.com/in/diego-armando-vasquez/" target="_blank" rel="noopener noreferrer" className="hover:text-certus-cyan transition-colors">
              Desarrollado por: Ing Diego Vasquez Chavez CIP: 337613
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
