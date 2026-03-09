import { TrendingUp, Plus, Calendar, Trophy, Star, X, PiggyBank, Target } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface SavingRecord {
  id: string;
  amount: number;
  date: string;
  comment: string;
}

export default function Progress() {
  const { user, firebaseUser, addSavingRecord, goals, addGoal } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [savings, setSavings] = useState<SavingRecord[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'savings'),
      where('userId', '==', firebaseUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: SavingRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as SavingRecord);
      });
      setSavings(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'savings');
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (goals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  if (!user) return null;

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

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(newGoalAmount);
    if (isNaN(numAmount) || numAmount <= 0 || !newGoalName.trim()) return;

    setIsSavingGoal(true);
    try {
      await addGoal(newGoalName.trim(), numAmount);
      setIsGoalModalOpen(false);
      setNewGoalName('');
      setNewGoalAmount('');
    } catch (error) {
      console.error("Failed to save goal", error);
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Process data for the chart (last 7 days)
  const chartData = processChartData(savings);

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-certus-magenta" />
          <h1 className="font-display text-xl font-bold text-certus-blue">Tu Progreso</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            {/* Metas */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-certus-blue">Tus Metas</h3>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="text-certus-cyan text-sm font-bold flex items-center gap-1 hover:text-certus-blue transition-colors"
              >
                <Plus size={16} /> Nueva Meta
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <Target className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 text-sm mb-4">Aún no tienes metas definidas.</p>
                <button 
                  onClick={() => setIsGoalModalOpen(true)}
                  className="bg-certus-cyan text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors"
                >
                  Crear mi primera meta
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {goals.map(goal => {
                  const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                  return (
                    <div key={goal.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-certus-magenta/5 rounded-bl-full -z-0"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-1">
                          <h2 className="text-xs text-gray-500 font-medium uppercase tracking-wider">{goal.status === 'completed' ? 'Completada' : 'Meta Activa'}</h2>
                          {goal.status === 'completed' && <Trophy className="text-certus-yellow" size={16} />}
                        </div>
                        <h3 className="font-display font-bold text-certus-blue text-xl mb-4">{goal.name}</h3>
                        
                        <div className="flex items-end gap-2 mb-2">
                          <span className="font-display font-bold text-3xl text-certus-magenta">S/ {goal.currentAmount}</span>
                          <span className="text-gray-500 mb-1">/ S/ {goal.targetAmount}</span>
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                          <div className="bg-certus-magenta h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-right text-certus-magenta font-bold">{progress}% completado</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              REGISTRAR AHORRO DE HOY
            </button>

            {/* Gráfico Semanal */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1 flex flex-col">
              <h3 className="font-display font-bold text-certus-blue mb-4">Últimos 7 días</h3>
              <div className="h-40 w-full flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#EEF2FB'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="amount" fill="#00C2FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {/* Logros */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-certus-yellow" size={20} />
                <h3 className="font-display font-bold text-certus-blue">Tus Logros</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <Badge icon="🌱" name="Primer Paso" active={savings.length > 0} />
                <Badge icon="🔥" name="Constante" active={savings.length >= 3} />
                <Badge icon="📚" name="Estudioso" active={user.completedCourses?.length > 0} />
                <Badge icon="🎯" name="Meta 50%" active={goals.some(g => g.currentAmount >= g.targetAmount / 2)} />
                <Badge icon="🛡️" name="Seguro" active={false} />
                <Badge icon="👑" name="Meta 100%" active={goals.some(g => g.status === 'completed')} />
              </div>
            </div>

            {/* Historial Reciente */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1">
              <h3 className="font-display font-bold text-certus-blue mb-4">Historial Reciente</h3>
              
              <div className="flex flex-col gap-4">
                {savings.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aún no tienes ahorros registrados.</p>
                ) : (
                  savings.slice(0, 5).map(record => (
                    <HistoryItem 
                      key={record.id}
                      date={new Date(record.date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                      amount={record.amount} 
                      desc={record.comment || 'Ahorro'} 
                    />
                  ))
                )}
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
                    src="/logo.png" 
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

      {/* Modal Nueva Meta */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-certus-blue/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-certus-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Target className="text-certus-cyan w-5 h-5" />
                Nueva Meta
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la meta</label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-certus-light border-2 border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors"
                  placeholder="Ej. Laptop nueva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Objetivo (S/)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
                  className="w-full bg-certus-light border-2 border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors font-display text-lg"
                  placeholder="0.00"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingGoal || !newGoalName || !newGoalAmount}
                className="w-full bg-certus-cyan text-white font-display font-bold py-4 rounded-xl mt-2 hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingGoal ? 'Guardando...' : 'CREAR META'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function processChartData(savings: SavingRecord[]) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const today = new Date();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    const dateString = d.toISOString().split('T')[0];
    
    const amountForDay = savings
      .filter(s => s.date.startsWith(dateString))
      .reduce((sum, s) => sum + s.amount, 0);

    data.push({ name: dayName, amount: amountForDay });
  }

  return data;
}

function Badge({ icon, name, active }: { icon: string, name: string, active: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
      active ? "bg-certus-light border-certus-cyan" : "bg-gray-50 border-gray-100 opacity-50 grayscale"
    )}>
      <div className="text-2xl mb-1">{icon}</div>
      <span className="text-[9px] font-bold text-certus-blue text-center leading-tight">{name}</span>
    </div>
  );
}

function HistoryItem({ date, amount, desc }: { date: string, amount: number, desc: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="bg-green-50 p-2 rounded-lg text-certus-success">
          <Plus size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold text-certus-blue">{desc}</p>
          <p className="text-[10px] text-gray-400 capitalize">{date}</p>
        </div>
      </div>
      <span className="font-bold text-certus-success text-sm">+ S/ {amount}</span>
    </div>
  );
}
