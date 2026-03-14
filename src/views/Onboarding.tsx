import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Baby, Backpack, Briefcase, Rocket, Target, BookOpen, ShieldAlert, CreditCard, PieChart, User as UserIcon } from 'lucide-react';
import Footer from '@/components/Footer';

const GOALS_BY_AGE: Record<string, { title: string, icon: React.ReactNode }[]> = {
  'niño': [
    { title: 'Ahorrar para un juguete o juego', icon: <Target className="text-certus-magenta" /> },
    { title: 'Aprender a juntar mis propinas', icon: <PieChart className="text-certus-cyan" /> },
    { title: 'Entender qué es el dinero', icon: <BookOpen className="text-certus-green" /> }
  ],
  'joven': [
    { title: 'Ahorrar para mis estudios o viaje', icon: <Target className="text-certus-magenta" /> },
    { title: 'Comprar mi primer celular/laptop', icon: <PieChart className="text-certus-cyan" /> },
    { title: 'Aprender a controlar mis gastos', icon: <BookOpen className="text-certus-green" /> },
    { title: 'Empezar a invertir con poco dinero', icon: <Rocket className="text-certus-blue" /> }
  ],
  'adulto_joven': [
    { title: 'Ahorrar para un depa o auto', icon: <Target className="text-certus-magenta" /> },
    { title: 'Salir de deudas de tarjetas', icon: <CreditCard className="text-certus-error" /> },
    { title: 'Crear un fondo de emergencia', icon: <ShieldAlert className="text-certus-green" /> },
    { title: 'Aprender a invertir mi sueldo', icon: <PieChart className="text-certus-cyan" /> }
  ],
  'adulto': [
    { title: 'Planificar mi jubilación', icon: <Target className="text-certus-magenta" /> },
    { title: 'Pagar la educación de mis hijos', icon: <BookOpen className="text-certus-blue" /> },
    { title: 'Salir de deudas grandes', icon: <CreditCard className="text-certus-error" /> },
    { title: 'Hacer crecer mi patrimonio', icon: <PieChart className="text-certus-green" /> }
  ],
  'emprendedor': [
    { title: 'Separar cuentas personales y negocio', icon: <PieChart className="text-certus-cyan" /> },
    { title: 'Ahorrar para invertir en mi negocio', icon: <Target className="text-certus-magenta" /> },
    { title: 'Manejar el flujo de caja', icon: <BookOpen className="text-certus-green" /> },
    { title: 'Salir de deudas del negocio', icon: <CreditCard className="text-certus-error" /> }
  ]
};

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser, firebaseUser, user, addGoal } = useAppContext();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<string | null>(null);
  const [habit, setHabit] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      navigate('/login');
    } else if (user) {
      navigate('/home');
    }
  }, [firebaseUser, user, navigate]);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const nameFromState = location.state?.name;
        await updateUser({
          name: nameFromState || firebaseUser?.displayName || 'Usuario',
          ageProfile: age as any,
          savedAmount: 0
        });
        if (goal) {
          await addGoal(goal, 1000);
        }
        navigate('/home');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  const currentGoals = age ? GOALS_BY_AGE[age] : [];

  return (
    <div className="flex flex-col h-screen bg-certus-light w-full items-center justify-center">
      <div className="w-full max-w-md bg-white h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col relative">
        <div className="pt-12 pb-4 px-6">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i <= step ? "bg-certus-blue" : "bg-gray-200"
              )}
            />
          ))}
        </div>
        <p className="text-sm font-display text-certus-blue font-semibold mb-1">Paso {step} de 3</p>
      </div>

      <div className="flex-1 px-6 overflow-y-auto pb-48">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <h2 className="font-display text-2xl font-bold text-certus-blue">¿Cuántos años tienes?</h2>
              <p className="text-gray-600">Esto nos ayuda a adaptar el lenguaje para ti.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <AgeCard icon={<Baby />} title="Niño" desc="10-12 años" selected={age === 'niño'} onClick={() => setAge('niño')} />
                <AgeCard icon={<Backpack />} title="Joven" desc="13-22 años" selected={age === 'joven'} onClick={() => setAge('joven')} />
                <AgeCard icon={<Briefcase />} title="Adulto joven" desc="23-35 años" selected={age === 'adulto_joven'} onClick={() => setAge('adulto_joven')} />
                <AgeCard icon={<UserIcon />} title="Adulto" desc="36 a más" selected={age === 'adulto'} onClick={() => setAge('adulto')} />
                <AgeCard icon={<Rocket />} title="Emprendedor" desc="Cualquier edad" selected={age === 'emprendedor'} onClick={() => setAge('emprendedor')} />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <h2 className="font-display text-2xl font-bold text-certus-blue">¿Cómo manejas tu dinero hoy?</h2>
              
              <div className="flex flex-col gap-3">
                <OptionCard title="Ahorro lo que sobra" selected={habit === 'sobra'} onClick={() => setHabit('sobra')} />
                <OptionCard title="Gasto todo lo que recibo" selected={habit === 'gasto'} onClick={() => setHabit('gasto')} />
                <OptionCard title="Intento organizar, pero me cuesta" selected={habit === 'intento'} onClick={() => setHabit('intento')} />
                <OptionCard title="Llevo un presupuesto mensual" selected={habit === 'presupuesto'} onClick={() => setHabit('presupuesto')} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <h2 className="font-display text-2xl font-bold text-certus-blue">¿Cuál es tu primera meta?</h2>
              
              <div className="grid grid-cols-1 gap-3">
                {currentGoals.map((g, idx) => (
                  <GoalCard 
                    key={idx} 
                    icon={g.icon} 
                    title={g.title} 
                    selected={goal === g.title} 
                    onClick={() => setGoal(g.title)} 
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent">
        <button 
          onClick={handleNext}
          disabled={(step === 1 && !age) || (step === 2 && !habit) || (step === 3 && !goal) || loading}
          className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'GUARDANDO...' : (step === 3 ? '¡EMPEZAR!' : 'Siguiente')}
        </button>
        <Footer />
      </div>
    </div>
    </div>
  );
}

function AgeCard({ icon, title, desc, selected, onClick }: { icon: React.ReactNode, title: string, desc: string, selected: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
        selected ? "border-certus-cyan bg-certus-light text-certus-blue" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
      )}
    >
      <div className={cn("mb-2", selected ? "text-certus-cyan" : "text-gray-400")}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-sm">{title}</h3>
      <p className="text-xs opacity-70">{desc}</p>
    </button>
  );
}

function OptionCard({ title, selected, onClick }: { title: string, selected: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center",
        selected ? "border-certus-cyan bg-certus-light text-certus-blue font-medium" : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center",
        selected ? "border-certus-cyan" : "border-gray-300"
      )}>
        {selected && <div className="w-2.5 h-2.5 bg-certus-cyan rounded-full" />}
      </div>
      {title}
    </button>
  );
}

function GoalCard({ icon, title, selected, onClick }: { icon: React.ReactNode, title: string, selected: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4",
        selected ? "border-certus-cyan bg-certus-light text-certus-blue" : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
      )}
    >
      <div className="p-2 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
      <span className="font-display font-semibold text-sm">{title}</span>
    </button>
  );
}
