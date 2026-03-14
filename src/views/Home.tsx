import { useAppContext } from '@/context/AppContext';
import { MessageSquare, PieChart, BookOpen, ShieldAlert, TrendingUp, User, Lightbulb, Plus, X, Users, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { doc, onSnapshot, getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import BrandIsotipo from '@/components/BrandIsotipo';

const CHALLENGE_TEXTS = [
  'Esta semana me pago primero: guardaré al menos el 10% de mi ingreso.',
  'Cada moneda cuenta: esta semana ahorraré todas las monedas que reciba.',
  'Hoy mi meta es clara: separaré un monto fijo para mi ahorro semanal.',
  'El dinero que no gaste en café o snacks esta semana irá directo a mi ahorro.',
  'Cada gasto que evite esta semana se convertirá en dinero guardado.',
  'Esta semana ahorraré el dinero de una salida o entretenimiento.',
  'Lo que ahorre cocinando en casa esta semana irá directo a mi fondo.',
  'Cada compra que postergue esta semana se transformará en ahorro.',
  'Esta semana guardaré todo ingreso extra que reciba.',
  'El dinero que no gaste en delivery esta semana será parte de mis ahorros.',
  'Hoy elijo mi futuro: ahorraré una cantidad fija antes de gastar.',
  'Cada gasto impulsivo que evite esta semana será un depósito en mi ahorro.',
  'Esta semana ahorraré el dinero equivalente a dos almuerzos fuera de casa.',
  'Mi reto es simple: guardaré una pequeña cantidad todos los días de esta semana.',
  'Cada vez que piense en comprar algo innecesario, ese dinero irá a mi ahorro.',
  'Esta semana transformaré un gasto innecesario en un ahorro real.',
  'Ahorraré el dinero que normalmente gastaría en un gusto pequeño.',
  'Cada descuento que consiga esta semana se convertirá en ahorro.',
  'Esta semana guardaré todo el dinero que logre ahorrar comparando precios.',
  'El dinero que no gaste en transporte extra esta semana irá a mi ahorro.',
  'Esta semana ahorraré una cantidad mayor que la semana pasada.',
  'Mi reto es claro: cada día de esta semana guardaré una pequeña suma.',
  'El dinero que reciba inesperadamente esta semana será ahorro.',
  'Cada compra evitada esta semana fortalecerá mi meta financiera.',
  'Esta semana separaré dinero solo para mi fondo de emergencia.',
  'Cada billete pequeño que reciba esta semana será parte de mi ahorro.',
  'Hoy empiezo fuerte: ahorraré más de lo que ahorré la semana pasada.',
  'El dinero que no gaste en entretenimiento esta semana será ahorro.',
  'Esta semana guardaré el equivalente a un gasto innecesario habitual.',
  'Cada decisión inteligente con mi dinero esta semana se reflejará en mi ahorro.',
  'Ahorraré el dinero que normalmente gastaría en compras impulsivas.',
  'Esta semana convertiré pequeños sacrificios en grandes ahorros.',
  'Cada gasto que reduzca en el supermercado esta semana será ahorro.',
  'Esta semana separaré dinero antes de pensar en gastar.',
  'Cada moneda que encuentre o reciba será parte de mi ahorro.',
  'El dinero que no gaste en antojos esta semana irá a mi meta financiera.',
  'Esta semana guardaré un porcentaje de todo el dinero que reciba.',
  'Cada gasto innecesario evitado será un paso más hacia mis metas.',
  'Esta semana ahorraré una cantidad que represente un esfuerzo real.',
  'El dinero que no gaste en ocio esta semana se convertirá en ahorro.',
  'Cada decisión financiera inteligente esta semana aumentará mi ahorro.',
  'Esta semana mi prioridad es clara: ahorrar antes de gastar.',
  'Cada día de esta semana terminará con una pequeña cantidad ahorrada.',
  'El dinero que no gaste en caprichos será inversión para mi futuro.',
  'Esta semana transformaré disciplina en dinero ahorrado.',
  'Cada ahorro de esta semana me acerca a mi meta financiera.',
  'Esta semana demostraré que pequeñas decisiones crean grandes ahorros.',
  'Hoy cierro mi reto anual celebrando cada sol que logré ahorrar.',
];

const CHALLENGES = CHALLENGE_TEXTS.map((text, idx) => ({
  text,
  comment: `Reto semanal: ${text}`,
}));

const TIP_TEXTS = [
  'El primer paso para controlar tu dinero es saber cuánto ganas.',
  'Lo que no se mide, no se puede mejorar: registra tus gastos.',
  'Pequeños gastos diarios pueden convertirse en grandes fugas de dinero.',
  'Equilibra tu dinero: vive, disfruta y ahorra con la regla 50-30-20.',
  'Págate primero: el ahorro es una prioridad, no lo que sobra.',
  'Cada meta financiera empieza con un sueño y un plan.',
  'Tu fondo de emergencia es tu tranquilidad financiera.',
  'Comparar precios hoy puede significar más ahorro mañana.',
  'Antes de comprar, respira... las mejores decisiones no son impulsivas.',
  'Si no lo usas, no lo pagues: revisa tus suscripciones.',
  'Los intereses pueden ser tu mejor aliado o tu peor enemigo.',
  'Pagar a tiempo hoy protege tu tranquilidad mañana.',
  'El crédito es una herramienta, no una extensión de tu ingreso.',
  'Revisar tus cuentas es cuidar tu dinero.',
  'Automatizar el ahorro es convertir la disciplina en hábito.',
  'Aprender sobre dinero hoy mejora tus decisiones mañana.',
  'Una lista de compras es una defensa contra el gasto impulsivo.',
  'Pagar el total de tu tarjeta es evitar que el interés gane.',
  'Tu talento puede convertirse en nuevas fuentes de ingreso.',
  'Invertir en tu educación es invertir en tu futuro.',
  'Un descuento inteligente es comprar lo necesario al mejor precio.',
  'Controlar tu presupuesto es dirigir el camino de tu dinero.',
  'Revisar tus metas financieras mantiene vivo tu propósito.',
  'Hablar de dinero en familia fortalece las decisiones financieras.',
  'Tu historial crediticio es tu reputación financiera.',
  'Conocer el sistema financiero te da poder para elegir mejor.',
  'Diversificar tus ahorros es proteger tu futuro.',
  'Las grandes compras merecen grandes planes.',
  'Un seguro no evita problemas, pero sí protege tu estabilidad.',
  'Cada avance financiero merece ser celebrado.',
  'Revisar tu mes financiero es el inicio de un mejor mes.',
];

const TIPS = TIP_TEXTS.map((text) => ({
  text,
  prompt: `Ayúdame a aplicar este tip del día: "${text}". Dame 3 acciones concretas para hoy.`,
}));

export default function Home() {
  const { user, addSavingRecord, goals, budget } = useAppContext();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalSavings: 0, totalGoals: 0, totalBudgets: 0, totalChats: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'public_stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats(prev => ({
          ...prev,
          totalUsers: data.totalUsers || 0,
          totalSavings: data.totalSavings || 0,
          totalGoals: data.totalGoals || 0,
          totalBudgets: data.totalBudgets || 0,
          totalChats: data.totalChats || 0
        }));
      } else {
        // Fallback if document doesn't exist yet
        setStats(prev => ({
          ...prev,
          totalUsers: 0,
          totalSavings: 0,
          totalGoals: 0,
          totalBudgets: 0,
          totalChats: 0
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Seleccionar reto y tip basados en la fecha actual para que cambien periódicamente
  const { currentChallenge, currentTip } = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const weekOfYear = Math.floor(dayOfYear / 7);
    
    return {
      currentChallenge: CHALLENGES[weekOfYear % CHALLENGES.length],
      currentTip: TIPS[dayOfYear % TIPS.length]
    };
  }, []);

  if (!user) return null;

  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const activeMonthKey = budget?.activeMonthKey || currentMonthKey;
  const activeMonthBudget = budget?.monthlyBudgets?.[activeMonthKey];
  const activeMonthLabel = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(
    new Date(Number(activeMonthKey.split('-')[0]), Number(activeMonthKey.split('-')[1]) - 1, 1)
  );

  const activeGoal = goals.find(g => g.status === 'active') || goals[0];
  const progress = activeGoal && activeGoal.targetAmount > 0 
    ? Math.min(100, Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100)) 
    : 0;

  const remainingBudget = budget
    ? activeMonthBudget
      ? (activeMonthBudget.fixedIncome + activeMonthBudget.variableIncome) - (activeMonthBudget.fixedExpenses + activeMonthBudget.variableExpenses)
      : (budget.fixedIncome + budget.variableIncome) - (budget.fixedExpenses + budget.variableExpenses)
    : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSaving(true);
    try {
      await addSavingRecord(numAmount, comment, selectedGoalId || undefined);
      setIsModalOpen(false);
      setAmount('');
      setComment('');
    } catch (error) {
      console.error("Failed to save record", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-certus-blue pt-12 pb-20 px-6 rounded-b-[40px] relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-white p-1 rounded-lg w-8 h-8 flex items-center justify-center overflow-hidden">
              <BrandIsotipo alt="Logo" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg">IAhorra</span>
          </div>
          <div className="w-10 h-10 bg-certus-cyan rounded-full flex items-center justify-center text-certus-blue font-display font-bold border-2 border-white cursor-pointer" onClick={() => navigate('/profile')}>
            {user.name.charAt(0).toUpperCase() || 'V'}
          </div>
        </div>
        
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          ¡Hola, {user.name || 'Valeria'}! 🌱
        </h1>
        <p className="text-white/80 text-sm">Listo para seguir creciendo hoy.</p>
      </div>

      <div className="px-6 -mt-12 relative z-10 flex flex-col gap-6">
        {/* Meta Activa */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(13,27,75,0.08)] border-t-4 border-certus-magenta">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Meta Activa</p>
              <h3 className="font-display font-bold text-certus-blue text-lg">{activeGoal ? activeGoal.name : 'Sin meta definida'}</h3>
            </div>
            <div className="bg-certus-light text-certus-magenta font-bold px-2 py-1 rounded text-sm">
              {progress}%
            </div>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
            <div className="bg-certus-magenta h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="flex justify-between text-sm mb-4">
            <span className="font-semibold text-certus-blue">S/ {activeGoal ? activeGoal.currentAmount : 0}</span>
            <span className="text-gray-500">de S/ {activeGoal ? activeGoal.targetAmount : 0}</span>
          </div>
          
          <button 
            onClick={() => {
              if (activeGoal) setSelectedGoalId(activeGoal.id);
              setIsModalOpen(true);
            }}
            className="w-full bg-certus-light text-certus-cyan font-display font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-certus-cyan/10 transition-colors"
          >
            <Plus size={18} />
            Registrar ahorro
          </button>
        </div>

        {/* Grid Accesos */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <QuickAccess icon={<MessageSquare className="text-certus-blue" />} label="Chat IAhorra" onClick={() => navigate('/chat')} />
          <QuickAccess icon={<PieChart className="text-certus-cyan" />} label="Simulador" onClick={() => navigate('/simulator')} />
          <QuickAccess icon={<BookOpen className="text-certus-green" />} label="Educación" onClick={() => navigate('/education')} />
          <QuickAccess icon={<ShieldAlert className="text-certus-error" />} label="Evita Fraudes" onClick={() => navigate('/frauds')} />
          <QuickAccess icon={<TrendingUp className="text-certus-magenta" />} label="Progreso" onClick={() => navigate('/progress')} />
          <QuickAccess icon={<User className="text-certus-yellow" />} label="Perfil" onClick={() => navigate('/profile')} />
        </div>

        {/* Resumen Presupuesto */}
        {remainingBudget !== null && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-certus-light flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-certus-blue">Tu Presupuesto</h3>
              <span className={`font-display font-bold ${remainingBudget > 0 ? 'text-certus-green' : 'text-certus-error'}`}>
                S/ {remainingBudget} {remainingBudget > 0 ? 'sobran' : 'faltan'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Mes activo: {activeMonthLabel.charAt(0).toUpperCase() + activeMonthLabel.slice(1)}</p>
            {remainingBudget > 0 ? (
              <div 
                className="bg-certus-light p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-certus-cyan/10 transition-colors"
                onClick={() => navigate('/chat', { state: { initialPrompt: `Me sobran S/ ${remainingBudget} en mi presupuesto este mes. ¿Qué me recomiendas hacer con este dinero?` } })}
              >
                <div className="bg-white p-2 rounded-full text-certus-cyan shrink-0 shadow-sm">
                  <Lightbulb size={18} />
                </div>
                <p className="text-xs text-certus-blue font-medium">
                  ¿Quieres saber qué hacer con el dinero que te sobra? Pregúntale a IAhorra.
                </p>
              </div>
            ) : (
              <div 
                className="bg-red-50 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => navigate('/chat', { state: { initialPrompt: `Mi presupuesto está en negativo por S/ ${Math.abs(remainingBudget)}. ¿Cómo puedo reducir mis gastos?` } })}
              >
                <div className="bg-white p-2 rounded-full text-certus-error shrink-0 shadow-sm">
                  <ShieldAlert size={18} />
                </div>
                <p className="text-xs text-certus-error font-medium">
                  Tu presupuesto está en negativo. Pregúntale a IAhorra cómo ajustarlo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reto de la semana */}
        <div className="bg-certus-yellow rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20">
            <Target size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⭐</span>
              <h3 className="font-display font-bold text-certus-blue">Reto de la semana</h3>
            </div>
            <p className="text-sm text-certus-blue/80 mb-4">
              {currentChallenge.text}
            </p>
            <button 
              onClick={() => {
                setComment(currentChallenge.comment);
                setIsModalOpen(true);
              }}
              className="bg-certus-blue text-white font-display font-semibold px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 transition-colors"
            >
              Aceptar reto
            </button>
          </div>
        </div>

        {/* Tip del día */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-certus-light flex gap-4 items-start cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/chat', { state: { initialPrompt: currentTip.prompt } })}>
          <div className="bg-certus-light p-2 rounded-full text-certus-cyan shrink-0">
            <Lightbulb size={20} />
          </div>
          <div>
            <h4 className="font-display font-semibold text-certus-blue text-sm mb-1">Tip del día</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {currentTip.text}
            </p>
          </div>
        </div>

        {/* Impacto IAhorra */}
        <div className="bg-certus-blue rounded-2xl p-5 shadow-sm text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-certus-cyan">⚡</span> Impacto IAhorra
            </h3>
            <div className="grid grid-cols-5 gap-1 text-center">
              <div className="flex flex-col items-center">
                <span className="text-lg font-display font-bold text-certus-cyan">{stats.totalUsers}</span>
                <span className="text-[8px] uppercase tracking-wider text-white/70 font-semibold mt-1">Usuarios</span>
              </div>
              <div className="flex flex-col items-center border-l border-white/10">
                <span className="text-lg font-display font-bold text-certus-magenta">{stats.totalSavings}</span>
                <span className="text-[8px] uppercase tracking-wider text-white/70 font-semibold mt-1">Ahorros</span>
              </div>
              <div className="flex flex-col items-center border-l border-white/10">
                <span className="text-lg font-display font-bold text-certus-green">{stats.totalGoals}</span>
                <span className="text-[8px] uppercase tracking-wider text-white/70 font-semibold mt-1">Metas</span>
              </div>
              <div className="flex flex-col items-center border-l border-white/10">
                <span className="text-lg font-display font-bold text-yellow-400">{stats.totalBudgets}</span>
                <span className="text-[8px] uppercase tracking-wider text-white/70 font-semibold mt-1">Pptos</span>
              </div>
              <div className="flex flex-col items-center border-l border-white/10">
                <span className="text-lg font-display font-bold text-blue-300">{stats.totalChats}</span>
                <span className="text-[8px] uppercase tracking-wider text-white/70 font-semibold mt-1">Chats</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Registrar Ahorro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-certus-blue/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-certus-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5">
                  <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-green w-4 h-4" />
                </div>
                Registrar ahorro
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-certus-light border-2 border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors font-display text-lg"
                  placeholder="0.00"
                />
              </div>
              {goals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destinar a meta</label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full bg-certus-light border-2 border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors"
                  >
                    <option value="">Sin meta específica</option>
                    {goals.filter(g => g.status === 'active').map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-certus-light border-2 border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors"
                  placeholder="Ej. Ahorro de la semana"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving || !amount}
                className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl mt-2 hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Guardando...' : 'GUARDAR AHORRO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAccess({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-50 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="bg-certus-light p-3 rounded-xl">
        {icon}
      </div>
      <span className="text-[10px] font-display font-semibold text-certus-blue text-center leading-tight">{label}</span>
    </button>
  );
}
