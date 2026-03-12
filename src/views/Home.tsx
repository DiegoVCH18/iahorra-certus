import { useAppContext } from '@/context/AppContext';
import { PiggyBank, MessageSquare, PieChart, BookOpen, ShieldAlert, TrendingUp, User, Lightbulb, Plus, X, Users, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { doc, onSnapshot, getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

const CHALLENGES = [
  { text: 'Ahorra el dinero de 2 "antojos" esta semana y regístralo.', comment: 'Reto: 2 antojos' },
  { text: 'Guarda el cambio de tus compras en efectivo durante 7 días.', comment: 'Reto: Cambio de compras' },
  { text: 'Prepara tu almuerzo en casa 3 veces esta semana y ahorra la diferencia.', comment: 'Reto: Almuerzo en casa' },
  { text: 'Cancela o pausa una suscripción que no hayas usado este mes.', comment: 'Reto: Suscripción cancelada' },
  { text: 'Vende un artículo que ya no uses y ahorra ese dinero.', comment: 'Reto: Venta de artículo' },
];

const TIPS = [
  { text: 'La regla 50/30/20 te ayuda a organizar tu dinero. Pregúntame en el chat cómo aplicarla a tu sueldo.', prompt: '¿Cómo aplico la regla 50/30/20 a mi sueldo?' },
  { text: 'Págate a ti mismo primero: separa tu ahorro apenas recibas tu ingreso, no al final del mes.', prompt: '¿Qué significa pagarse a uno mismo primero?' },
  { text: 'Evita los "gastos hormiga". Esos pequeños consumos diarios suman mucho al mes. Pregúntame cómo identificarlos.', prompt: '¿Cómo identifico y reduzco mis gastos hormiga?' },
  { text: 'Antes de comprar algo que no necesitas, aplica la regla de las 24 horas. ¡Pregúntame de qué trata!', prompt: '¿Qué es la regla de las 24 horas para compras?' },
  { text: 'Tener un fondo de emergencia te salva de deudas imprevistas. Pregúntame cuánto deberías tener guardado.', prompt: '¿Cuánto dinero debería tener en mi fondo de emergencia?' },
];

export default function Home() {
  const { user, addSavingRecord, goals, budget } = useAppContext();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);
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

  const activeGoal = goals.find(g => g.status === 'active') || goals[0];
  const progress = activeGoal && activeGoal.targetAmount > 0 
    ? Math.min(100, Math.round((activeGoal.currentAmount / activeGoal.targetAmount) * 100)) 
    : 0;

  const remainingBudget = budget 
    ? (budget.fixedIncome + budget.variableIncome) - (budget.fixedExpenses + budget.variableExpenses)
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
              {!logoError ? (
                <img 
                  src="/pwa-192x192.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <PiggyBank className="text-certus-blue w-5 h-5" />
              )}
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
                  <img 
                    src="/pwa-192x192.png" 
                    alt="IAhorra" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <PiggyBank className="text-certus-green w-4 h-4 hidden" />
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
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-50 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="bg-certus-light p-3 rounded-xl">
        {icon}
      </div>
      <span className="text-[10px] font-display font-semibold text-certus-blue text-center leading-tight">{label}</span>
    </div>
  );
}
