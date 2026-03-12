import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank, MessageSquare, PieChart, ShieldAlert, ArrowRight } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import Footer from '@/components/Footer';
import BrandIsotipo from '@/components/BrandIsotipo';

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
  const [stats, setStats] = useState({ totalUsers: 0, totalSavings: 0, totalGoals: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'public_stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalSavings: data.totalSavings || 0,
          totalGoals: data.totalGoals || 0
        });
      } else {
        // Fallback if document doesn't exist yet
        setStats({
          totalUsers: 0,
          totalSavings: 0,
          totalGoals: 0
        });
      }
    });
    return () => unsubscribe();
  }, []);

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
              <BrandIsotipo alt="IAhorra CERTUS Logo" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-16 h-16" />
            ) : (
              STEPS[currentStep].icon
            )}
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
          
          {currentStep === 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full border border-white/20">
              <p className="text-xs text-certus-cyan font-bold uppercase tracking-wider mb-3">Impacto en tiempo real</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-display font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-[9px] uppercase text-white/70">Usuarios</div>
                </div>
                <div className="border-l border-r border-white/20">
                  <div className="text-xl font-display font-bold text-white">{stats.totalSavings}</div>
                  <div className="text-[9px] uppercase text-white/70">Ahorros</div>
                </div>
                <div>
                  <div className="text-xl font-display font-bold text-white">{stats.totalGoals}</div>
                  <div className="text-[9px] uppercase text-white/70">Metas</div>
                </div>
              </div>
            </div>
          )}
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
        
        <Footer light />
      </div>
    </div>
  );
}
