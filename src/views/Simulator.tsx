import { useState } from 'react';
import { PieChart as PieChartIcon, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

export default function Simulator() {
  const { addGoal } = useAppContext();
  
  // Ahorro State
  const [goalName, setGoalName] = useState('Mi nueva meta');
  const [goalAmount, setGoalAmount] = useState('2000');
  const [monthlySave, setMonthlySave] = useState('200');
  const [interestRate, setInterestRate] = useState('4');
  const [isSaved, setIsSaved] = useState(false);

  // Ahorro Logic
  const monthsToGoal = Math.ceil(Number(goalAmount) / Number(monthlySave));
  const savingsData = Array.from({ length: Math.min(monthsToGoal + 1, 24) }, (_, i) => {
    const principal = i * Number(monthlySave);
    const rate = Number(interestRate) / 100 / 12;
    const withInterest = i === 0 ? 0 : principal * Math.pow(1 + rate, i); // Simplified
    return {
      month: `Mes ${i}`,
      ahorro: principal,
      conInteres: Math.round(withInterest)
    };
  });

  const handleSavePlan = async () => {
    await addGoal(goalName, Number(goalAmount));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="text-certus-cyan" />
          <h1 className="font-display text-xl font-bold text-certus-blue">Simulador de Ahorro</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Nombre de la meta</label>
            <input 
              type="text" 
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-3 outline-none font-display font-bold text-certus-blue text-lg" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">¿Cuánto quieres ahorrar? (S/)</label>
            <input 
              type="number" 
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-3 outline-none font-display font-bold text-certus-blue text-lg" 
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Ahorro mensual (S/)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="10" 
                max="1000" 
                step="10"
                value={monthlySave}
                onChange={(e) => setMonthlySave(e.target.value)}
                className="flex-1 accent-certus-cyan"
              />
              <span className="font-display font-bold text-certus-blue w-16 text-right">S/ {monthlySave}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Tasa de interés anual (%)</label>
            <input 
              type="number" 
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-2 outline-none font-display font-bold text-certus-blue" 
            />
            <p className="text-[10px] text-gray-400">Referencia SBS: Cuentas a plazo rinden aprox 4-6%</p>
          </div>
          <button 
            onClick={handleSavePlan}
            className={cn(
              "w-full font-display font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-auto",
              isSaved ? "bg-certus-success text-white" : "bg-certus-magenta text-white hover:bg-opacity-90"
            )}
          >
            {isSaved ? "¡PLAN GUARDADO!" : <><Save size={20} /> GUARDAR ESTE PLAN</>}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
          <h3 className="font-display font-bold text-certus-blue mb-4">Proyección</h3>
          <div className="h-48 w-full flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0D1B4B' }}
                />
                <Line type="monotone" dataKey="ahorro" stroke="#00C2FF" strokeWidth={3} dot={false} name="Solo ahorro" />
                <Line type="monotone" dataKey="conInteres" stroke="#3DBE7A" strokeWidth={3} dot={false} name="Con interés" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 bg-certus-light p-4 rounded-xl">
            <p className="text-sm text-certus-blue">
              Ahorrando <strong>S/ {monthlySave}</strong> al mes, llegarás a tu meta en aprox. <strong>{monthsToGoal} meses</strong>.
            </p>
          </div>
        </div>
      </div>
      <div className="px-6">
        <p className="text-center text-[10px] text-gray-400 italic mt-2">
          * Datos referenciales. Fórmulas simplificadas para fines educativos.
        </p>
      </div>
    </div>
  );
}
