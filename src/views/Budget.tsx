import { useState, useEffect } from 'react';
import { Calculator, Save } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

export default function Budget() {
  const { budget, saveBudget } = useAppContext();
  
  const [isBudgetSaved, setIsBudgetSaved] = useState(false);

  // Presupuesto State
  const [fixedIncome, setFixedIncome] = useState('1500');
  const [variableIncome, setVariableIncome] = useState('0');
  const [fixedExpenses, setFixedExpenses] = useState('800');
  const [variableExpenses, setVariableExpenses] = useState('400');

  useEffect(() => {
    if (budget) {
      setFixedIncome(budget.fixedIncome.toString());
      setVariableIncome(budget.variableIncome.toString());
      setFixedExpenses(budget.fixedExpenses.toString());
      setVariableExpenses(budget.variableExpenses.toString());
    }
  }, [budget]);

  // Presupuesto Logic
  const totalIncome = Number(fixedIncome) + Number(variableIncome);
  const totalExpenses = Number(fixedExpenses) + Number(variableExpenses);
  const remaining = totalIncome - totalExpenses;
  const budgetData = [
    { name: 'Fijos', value: Number(fixedExpenses), color: '#E05C5C' },
    { name: 'Variables', value: Number(variableExpenses), color: '#F5C842' },
    { name: 'Sobra', value: Math.max(0, remaining), color: '#3DBE7A' },
  ];

  const handleSaveBudget = async () => {
    await saveBudget({
      fixedIncome: Number(fixedIncome),
      variableIncome: Number(variableIncome),
      fixedExpenses: Number(fixedExpenses),
      variableExpenses: Number(variableExpenses)
    });
    setIsBudgetSaved(true);
    setTimeout(() => setIsBudgetSaved(false), 3000);
  };

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="text-certus-cyan" />
          <h1 className="font-display text-xl font-bold text-certus-blue">Mi Presupuesto</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Ingresos Fijos (S/)</label>
            <p className="text-[10px] text-gray-400 leading-tight mb-1">Sueldo, mesada constante.</p>
            <input 
              type="number" 
              value={fixedIncome}
              onChange={(e) => setFixedIncome(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-2 outline-none font-display font-bold text-certus-blue" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Ingresos Variables (S/)</label>
            <p className="text-[10px] text-gray-400 leading-tight mb-1">Cachuelos, ventas ocasionales, bonos.</p>
            <input 
              type="number" 
              value={variableIncome}
              onChange={(e) => setVariableIncome(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-2 outline-none font-display font-bold text-certus-blue" 
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Gastos Fijos (S/)</label>
            <p className="text-[10px] text-gray-400 leading-tight mb-1">Alquiler, luz, agua, internet, pasajes, comida básica.</p>
            <input 
              type="number" 
              value={fixedExpenses}
              onChange={(e) => setFixedExpenses(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-error rounded-lg px-4 py-2 outline-none font-display font-bold text-certus-blue" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Gastos Variables (S/)</label>
            <p className="text-[10px] text-gray-400 leading-tight mb-1">Salidas, ropa, gustos, streaming.</p>
            <input 
              type="number" 
              value={variableExpenses}
              onChange={(e) => setVariableExpenses(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-yellow rounded-lg px-4 py-2 outline-none font-display font-bold text-certus-blue" 
            />
          </div>

          <button 
            onClick={handleSaveBudget}
            className={cn(
              "w-full font-display font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-auto",
              isBudgetSaved ? "bg-certus-success text-white" : "bg-certus-magenta text-white hover:bg-opacity-90"
            )}
          >
            {isBudgetSaved ? "¡PRESUPUESTO GUARDADO!" : <><Save size={20} /> GUARDAR PRESUPUESTO</>}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
          <h3 className="font-display font-bold text-certus-blue mb-2">Tu Distribución</h3>
          <div className="h-48 w-full relative flex items-center justify-center flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `S/ ${value}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-500">Sobra</span>
              <span className={cn("font-display font-bold text-lg", remaining > 0 ? "text-certus-green" : "text-certus-error")}>
                S/ {remaining}
              </span>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-2">
            {budgetData.map(item => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>

          <div className={cn("mt-6 p-4 rounded-xl", remaining > 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-sm font-medium", remaining > 0 ? "text-certus-green" : "text-certus-error")}>
              {remaining > 0 
                ? `¡Excelente! Te sobran S/ ${remaining} que puedes destinar al ahorro.` 
                : `Cuidado, estás gastando S/ ${Math.abs(remaining)} más de lo que ganas. Revisa tus gastos variables.`}
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
