import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Calculator, Save, Plus, Trash2, Edit2, Check, X, AlertTriangle, CheckCircle2, Info, CalendarDays } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { useAppContext, Budget, BudgetItem } from '@/context/AppContext';

interface MonthBudgetData {
  fixedIncome: number;
  variableIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  fixedIncomeItems: BudgetItem[];
  variableIncomeItems: BudgetItem[];
  fixedExpensesItems: BudgetItem[];
  variableExpensesItems: BudgetItem[];
}

const createItemId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const cloneItemsWithNewIds = (items: BudgetItem[]) => items.map((item) => ({ ...item, id: createItemId() }));

const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getPreviousMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const previous = new Date(year, month - 2, 1);
  return toMonthKey(previous);
};

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const formatted = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const createEmptyMonthBudget = (): MonthBudgetData => ({
  fixedIncome: 0,
  variableIncome: 0,
  fixedExpenses: 0,
  variableExpenses: 0,
  fixedIncomeItems: [],
  variableIncomeItems: [],
  fixedExpensesItems: [],
  variableExpensesItems: []
});

const normalizeMonthBudget = (budget: Budget): MonthBudgetData => ({
  fixedIncome: budget.fixedIncome || 0,
  variableIncome: budget.variableIncome || 0,
  fixedExpenses: budget.fixedExpenses || 0,
  variableExpenses: budget.variableExpenses || 0,
  fixedIncomeItems: budget.fixedIncomeItems || (budget.fixedIncome ? [{ id: createItemId(), concept: 'Ingreso Fijo', amount: budget.fixedIncome }] : []),
  variableIncomeItems: budget.variableIncomeItems || (budget.variableIncome ? [{ id: createItemId(), concept: 'Ingreso Variable', amount: budget.variableIncome }] : []),
  fixedExpensesItems: budget.fixedExpensesItems || (budget.fixedExpenses ? [{ id: createItemId(), concept: 'Gasto Fijo', amount: budget.fixedExpenses }] : []),
  variableExpensesItems: budget.variableExpensesItems || (budget.variableExpenses ? [{ id: createItemId(), concept: 'Gasto Variable', amount: budget.variableExpenses }] : [])
});

const isBudgetDataEmpty = (data: MonthBudgetData) => (
  data.fixedIncomeItems.length === 0 &&
  data.variableIncomeItems.length === 0 &&
  data.fixedExpensesItems.length === 0 &&
  data.variableExpensesItems.length === 0 &&
  data.fixedIncome === 0 &&
  data.variableIncome === 0 &&
  data.fixedExpenses === 0 &&
  data.variableExpenses === 0
);

interface BudgetSectionProps {
  title: string;
  description: string;
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  suggestions: string[];
  colorClass: string;
}

function BudgetSection({ title, description, items, onChange, suggestions: initialSuggestions, colorClass }: BudgetSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newConcept, setNewConcept] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConcept, setEditConcept] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [customSuggestions, setCustomSuggestions] = useState<string[]>([]);

  const allSuggestions = useMemo(() => {
    return Array.from(new Set([...initialSuggestions, ...customSuggestions]));
  }, [initialSuggestions, customSuggestions]);

  const handleAdd = () => {
    if (!newConcept || !newAmount) return;
    const newItem: BudgetItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      concept: newConcept,
      amount: Number(newAmount)
    };
    onChange([...items, newItem]);
    
    // Add to custom suggestions if it's not already in the list
    if (!allSuggestions.includes(newConcept)) {
      setCustomSuggestions(prev => [...prev, newConcept]);
    }

    setNewConcept('');
    setNewAmount('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditConcept(item.concept);
    setEditAmount(item.amount.toString());
  };

  const saveEdit = () => {
    if (!editConcept || !editAmount) return;
    onChange(items.map(item => 
      item.id === editingId 
        ? { ...item, concept: editConcept, amount: Number(editAmount) }
        : item
    ));
    setEditingId(null);
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">{title}</label>
          <p className="text-[10px] text-gray-400 leading-tight">{description}</p>
        </div>
        <span className={cn("font-display font-bold", colorClass)}>S/ {total.toFixed(2)}</span>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
            {editingId === item.id ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 w-full">
                  <input 
                    type="text" 
                    value={editConcept}
                    onChange={(e) => setEditConcept(e.target.value)}
                    className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm outline-none focus:border-certus-cyan"
                    placeholder="Concepto"
                    list={`suggestions-${title.replace(/\s+/g, '-')}`}
                  />
                  <input 
                    type="number" 
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-24 shrink-0 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm outline-none focus:border-certus-cyan"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 w-full">
                  <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 text-gray-500 bg-gray-100 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"><X size={14} /> CANCELAR</button>
                  <button onClick={saveEdit} disabled={!editConcept || !editAmount} className="flex-1 flex items-center justify-center gap-1 text-white bg-certus-green px-3 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50"><Check size={14} /> GUARDAR</button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">{item.concept}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-certus-blue">S/ {item.amount.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-certus-cyan p-1"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-certus-error p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-certus-cyan shadow-sm">
            <div className="flex gap-2 w-full">
              <input 
                type="text" 
                value={newConcept}
                onChange={(e) => setNewConcept(e.target.value)}
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm outline-none focus:border-certus-cyan"
                placeholder="Concepto"
                list={`suggestions-${title.replace(/\s+/g, '-')}`}
                autoFocus
              />
              <datalist id={`suggestions-${title.replace(/\s+/g, '-')}`}>
                {allSuggestions.map(s => <option key={s} value={s} />)}
              </datalist>
              <input 
                type="number" 
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-24 shrink-0 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm outline-none focus:border-certus-cyan"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-end gap-2 w-full">
              <button onClick={() => setIsAdding(false)} className="flex-1 flex items-center justify-center gap-1 text-gray-500 bg-gray-100 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"><X size={14} /> CANCELAR</button>
              <button onClick={handleAdd} disabled={!newConcept || !newAmount} className="flex-1 flex items-center justify-center gap-1 text-white bg-certus-cyan px-3 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50"><Check size={14} /> AGREGAR</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1 text-xs font-semibold text-certus-cyan py-2 border border-dashed border-certus-cyan/30 rounded-lg hover:bg-certus-cyan/5 transition-colors"
          >
            <Plus size={14} /> AGREGAR ELEMENTO
          </button>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS_BY_PROFILE: Record<string, { fixedIncome: string[], variableIncome: string[], fixedExpenses: string[], variableExpenses: string[] }> = {
  niño: {
    fixedIncome: ['Mesada', 'Apoyo familiar'],
    variableIncome: ['Propinas', 'Premios', 'Venta de reciclaje', 'Actividades escolares'],
    fixedExpenses: ['Lonchera', 'Pasajes escolares', 'Útiles', 'Cuotas escolares'],
    variableExpenses: ['Golosinas', 'Juguetes', 'Salidas', 'Videojuegos']
  },
  joven: {
    fixedIncome: ['Mesada', 'Apoyo familiar'],
    variableIncome: ['Propinas', 'Trabajos ocasionales', 'Venta de productos', 'Premios'],
    fixedExpenses: ['Transporte', 'Recargas', 'Materiales de estudio', 'Alimentación'],
    variableExpenses: ['Streaming', 'Ropa', 'Salidas', 'Entretenimiento']
  },
  adulto_joven: {
    fixedIncome: ['Sueldo', 'Pensión', 'Renta', 'Apoyo familiar'],
    variableIncome: ['Horas extra', 'Comisiones', 'Bonos', 'Freelance', 'Cachuelos', 'Ventas'],
    fixedExpenses: ['Alquiler', 'Luz', 'Agua', 'Internet', 'Transporte', 'Alimentación', 'Estudios', 'Deudas'],
    variableExpenses: ['Streaming', 'Ropa', 'Salidas', 'Gimnasio', 'Compras personales', 'Entretenimiento']
  },
  adulto: {
    fixedIncome: ['Sueldo', 'Negocio', 'Renta', 'Pensión'],
    variableIncome: ['Bonos', 'Comisiones', 'Ventas', 'Ingresos extra'],
    fixedExpenses: ['Hipoteca o alquiler', 'Servicios', 'Alimentación', 'Educación', 'Salud', 'Transporte', 'Seguros'],
    variableExpenses: ['Salidas', 'Ropa', 'Regalos', 'Entretenimiento', 'Mantenimiento']
  },
  emprendedor: {
    fixedIncome: ['Ingresos del negocio', 'Sueldo', 'Renta'],
    variableIncome: ['Ventas extraordinarias', 'Comisiones', 'Bonos', 'Cachuelos'],
    fixedExpenses: ['Alquiler', 'Servicios', 'Alimentación', 'Transporte', 'Insumos', 'Pago de deudas'],
    variableExpenses: ['Salidas', 'Ropa', 'Entretenimiento', 'Imprevistos del negocio']
  },
  default: {
    fixedIncome: ['Sueldo', 'Pensión', 'Renta', 'Mesada', 'Apoyo familiar'],
    variableIncome: ['Comisiones', 'Ventas', 'Bonos', 'Cachuelos', 'Trabajos freelance', 'Propinas'],
    fixedExpenses: ['Alquiler', 'Luz', 'Agua', 'Internet', 'Transporte', 'Alimentación', 'Educación', 'Préstamo'],
    variableExpenses: ['Salidas', 'Ropa', 'Streaming (Netflix, Spotify)', 'Gustos', 'Regalos', 'Cine', 'Comida fuera']
  }
};

export default function Budget() {
  const { budget, saveBudget, user } = useAppContext();
  const currentMonthKey = useMemo(() => toMonthKey(new Date()), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
  
  const [isBudgetSaved, setIsBudgetSaved] = useState(false);
  const [budgetSaveError, setBudgetSaveError] = useState<string | null>(null);
  const [copyPreviousChecked, setCopyPreviousChecked] = useState(false);
  const [copyStatusMessage, setCopyStatusMessage] = useState<string | null>(null);

  // Presupuesto State
  const [fixedIncomeItems, setFixedIncomeItems] = useState<BudgetItem[]>([]);
  const [variableIncomeItems, setVariableIncomeItems] = useState<BudgetItem[]>([]);
  const [fixedExpensesItems, setFixedExpensesItems] = useState<BudgetItem[]>([]);
  const [variableExpensesItems, setVariableExpensesItems] = useState<BudgetItem[]>([]);

  const monthlyBudgets = useMemo<Record<string, MonthBudgetData>>(() => {
    if (!budget) return {};
    if (budget.monthlyBudgets && Object.keys(budget.monthlyBudgets).length > 0) {
      return budget.monthlyBudgets;
    }

    const legacyBudget = normalizeMonthBudget(budget);
    if (isBudgetDataEmpty(legacyBudget)) {
      return {};
    }

    return { [currentMonthKey]: legacyBudget };
  }, [budget, currentMonthKey]);

  const selectedMonthLabel = useMemo(() => formatMonthLabel(selectedMonthKey), [selectedMonthKey]);
  const previousMonthKey = useMemo(() => getPreviousMonthKey(selectedMonthKey), [selectedMonthKey]);
  const previousMonthLabel = useMemo(() => formatMonthLabel(previousMonthKey), [previousMonthKey]);
  const previousMonthBudget = monthlyBudgets[previousMonthKey];
  const canCopyPreviousMonth = !!previousMonthBudget && !isBudgetDataEmpty(previousMonthBudget);

  useEffect(() => {
    const monthData = monthlyBudgets[selectedMonthKey] || createEmptyMonthBudget();
    setFixedIncomeItems(cloneItemsWithNewIds(monthData.fixedIncomeItems));
    setVariableIncomeItems(cloneItemsWithNewIds(monthData.variableIncomeItems));
    setFixedExpensesItems(cloneItemsWithNewIds(monthData.fixedExpensesItems));
    setVariableExpensesItems(cloneItemsWithNewIds(monthData.variableExpensesItems));
    setCopyPreviousChecked(false);
    setCopyStatusMessage(null);
  }, [monthlyBudgets, selectedMonthKey]);

  const suggestions = useMemo(() => {
    const profile = user?.ageProfile || 'default';
    return SUGGESTIONS_BY_PROFILE[profile] || SUGGESTIONS_BY_PROFILE.default;
  }, [user?.ageProfile]);

  // Presupuesto Logic
  const totalFixedIncome = fixedIncomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalVariableIncome = variableIncomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalFixedExpenses = fixedExpensesItems.reduce((sum, item) => sum + item.amount, 0);
  const totalVariableExpenses = variableExpensesItems.reduce((sum, item) => sum + item.amount, 0);

  const totalIncome = totalFixedIncome + totalVariableIncome;
  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const remaining = totalIncome - totalExpenses;
  const savingPercentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;
  const isCurrentMonthBlank = fixedIncomeItems.length === 0 && variableIncomeItems.length === 0 && fixedExpensesItems.length === 0 && variableExpensesItems.length === 0;
  
  const budgetData = [
    { name: 'Fijos', value: totalFixedExpenses, color: '#E05C5C' },
    { name: 'Variables', value: totalVariableExpenses, color: '#F5C842' },
    { name: 'Sobra', value: Math.max(0, remaining), color: '#3DBE7A' },
  ];

  const handleMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextMonth = event.target.value;
    if (!nextMonth) return;
    setSelectedMonthKey(nextMonth);
    setIsBudgetSaved(false);
  };

  const handleCopyPreviousMonth = (event: ChangeEvent<HTMLInputElement>) => {
    const shouldCopy = event.target.checked;
    setCopyPreviousChecked(shouldCopy);

    if (!shouldCopy) {
      setCopyStatusMessage(null);
      return;
    }

    if (!previousMonthBudget || !canCopyPreviousMonth) {
      setCopyPreviousChecked(false);
      setCopyStatusMessage('No hay datos del mes anterior para copiar.');
      return;
    }

    if (!isCurrentMonthBlank) {
      const shouldOverwrite = window.confirm('Este mes ya tiene datos en edición. ¿Deseas reemplazarlos con el presupuesto del mes anterior?');
      if (!shouldOverwrite) {
        setCopyPreviousChecked(false);
        return;
      }
    }

    setFixedIncomeItems(cloneItemsWithNewIds(previousMonthBudget.fixedIncomeItems));
    setVariableIncomeItems(cloneItemsWithNewIds(previousMonthBudget.variableIncomeItems));
    setFixedExpensesItems(cloneItemsWithNewIds(previousMonthBudget.fixedExpensesItems));
    setVariableExpensesItems(cloneItemsWithNewIds(previousMonthBudget.variableExpensesItems));
    setCopyStatusMessage(`Se copiaron los datos de ${previousMonthLabel}.`);
  };

  const handleSaveBudget = async () => {
    const monthPayload: MonthBudgetData = {
      fixedIncome: totalFixedIncome,
      variableIncome: totalVariableIncome,
      fixedExpenses: totalFixedExpenses,
      variableExpenses: totalVariableExpenses,
      fixedIncomeItems,
      variableIncomeItems,
      fixedExpensesItems,
      variableExpensesItems
    };

    const updatedMonthlyBudgets: Record<string, MonthBudgetData> = {
      ...monthlyBudgets,
      [selectedMonthKey]: monthPayload
    };

    try {
      await saveBudget({
        ...monthPayload,
        monthlyBudgets: updatedMonthlyBudgets,
        activeMonthKey: selectedMonthKey
      });

      setBudgetSaveError(null);
      setIsBudgetSaved(true);
      setTimeout(() => setIsBudgetSaved(false), 3000);
    } catch (error) {
      setIsBudgetSaved(false);
      setBudgetSaveError('No se pudo guardar el presupuesto. Verifica tu conexión e inténtalo nuevamente.');
    }
  };

  const getTrafficLight = () => {
    if (remaining < 0) {
      return {
        color: 'bg-red-50 border-red-200 text-red-700',
        icon: <AlertTriangle className="text-red-500" size={20} />,
        title: 'Saldo Negativo',
        message: 'Tu saldo es negativo. Es necesario ajustar tus gastos.'
      };
    } else if (savingPercentage < 10) {
      return {
        color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        icon: <Info className="text-yellow-500" size={20} />,
        title: 'Alerta de Ahorro',
        message: 'No hay suficiente capacidad de ahorro. Intenta mejorar tu margen.'
      };
    } else {
      return {
        color: 'bg-green-50 border-green-200 text-green-700',
        icon: <CheckCircle2 className="text-green-500" size={20} />,
        title: '¡Buen Trabajo!',
        message: 'Vas muy bien. Tienes suficiente capacidad de ahorro.'
      };
    }
  };

  const trafficLight = getTrafficLight();

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="text-certus-cyan" />
          <h1 className="font-display text-xl font-bold text-certus-blue">Mi Presupuesto</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Mes del presupuesto</p>
            <p className="text-sm font-bold text-certus-blue">{selectedMonthLabel}</p>
          </div>
          <div className="flex flex-col gap-1 sm:items-end">
            <label htmlFor="budget-month" className="text-xs text-gray-500 font-medium">Cambiar mes</label>
            <input
              id="budget-month"
              type="month"
              value={selectedMonthKey}
              onChange={handleMonthChange}
              aria-label="Seleccionar mes del presupuesto"
              className="w-full sm:w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-certus-blue outline-none focus:border-certus-cyan focus:ring-2 focus:ring-certus-cyan/20"
            />
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-1">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-start gap-2">
              <CalendarDays className="text-certus-blue mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-certus-blue">Control mensual activo: {selectedMonthLabel}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {isCurrentMonthBlank
                    ? 'Este mes inicia en blanco para que registres tu presupuesto sin arrastrar datos por error.'
                    : 'Tienes datos en edición para este mes. Guarda para mantener el historial mensual.'}
                </p>
              </div>
            </div>

            <label className={cn('mt-3 flex items-start gap-2 text-sm', canCopyPreviousMonth ? 'text-gray-700' : 'text-gray-400')}>
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-certus-cyan"
                checked={copyPreviousChecked}
                onChange={handleCopyPreviousMonth}
                disabled={!canCopyPreviousMonth}
                aria-label={`Copiar datos del presupuesto de ${previousMonthLabel}`}
              />
              <span>
                Copiar datos del presupuesto del mes anterior ({previousMonthLabel})
              </span>
            </label>

            {!canCopyPreviousMonth && (
              <p className="mt-2 text-xs text-gray-500">
                Aún no hay datos guardados en {previousMonthLabel} para copiar.
              </p>
            )}

            {copyStatusMessage && (
              <p className="mt-2 text-xs font-medium text-certus-blue">{copyStatusMessage}</p>
            )}

            {budgetSaveError && (
              <p className="mt-2 text-xs font-medium text-certus-error">{budgetSaveError}</p>
            )}
          </div>
          
          <BudgetSection
            title="Ingresos Fijos (S/)"
            description="Sueldo, pensión, renta, mesada constante."
            items={fixedIncomeItems}
            onChange={setFixedIncomeItems}
            suggestions={suggestions.fixedIncome}
            colorClass="text-certus-cyan"
          />

          <BudgetSection
            title="Ingresos Variables (S/)"
            description="Comisiones, ventas ocasionales, bonos, cachuelos."
            items={variableIncomeItems}
            onChange={setVariableIncomeItems}
            suggestions={suggestions.variableIncome}
            colorClass="text-certus-cyan"
          />
          
          <BudgetSection
            title="Gastos Fijos (S/)"
            description="Alquiler, luz, agua, internet, transporte, comida básica."
            items={fixedExpensesItems}
            onChange={setFixedExpensesItems}
            suggestions={suggestions.fixedExpenses}
            colorClass="text-certus-error"
          />

          <BudgetSection
            title="Gastos Variables (S/)"
            description="Salidas, ropa, gustos personales, streaming."
            items={variableExpensesItems}
            onChange={setVariableExpensesItems}
            suggestions={suggestions.variableExpenses}
            colorClass="text-certus-yellow"
          />

          <button 
            onClick={handleSaveBudget}
            className={cn(
              "w-full font-display font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4",
              isBudgetSaved ? "bg-certus-success text-white" : "bg-certus-magenta text-white hover:bg-opacity-90"
            )}
          >
            {isBudgetSaved ? "¡PRESUPUESTO GUARDADO!" : <><Save size={20} /> GUARDAR PRESUPUESTO</>}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
          <h3 className="font-display font-bold text-certus-blue mb-2">Tu Distribución</h3>
          <div className="h-52 md:h-64 lg:h-72 w-full relative flex items-center justify-center flex-1 min-h-[220px] md:min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="78%"
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
                S/ {remaining.toFixed(2)}
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

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total Ingresos</p>
              <p className="font-display font-bold text-certus-cyan">S/ {totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total Gastos</p>
              <p className="font-display font-bold text-certus-error">S/ {totalExpenses.toFixed(2)}</p>
            </div>
          </div>

          <div className={cn("mt-4 p-4 rounded-xl border flex flex-col gap-2", trafficLight.color)}>
            <div className="flex items-center gap-2">
              {trafficLight.icon}
              <h4 className="font-display font-bold">{trafficLight.title}</h4>
            </div>
            <p className="text-sm font-medium">
              {trafficLight.message}
            </p>
            {totalIncome > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs opacity-80">Capacidad de ahorro:</span>
                <span className="text-sm font-bold">{savingPercentage.toFixed(1)}%</span>
              </div>
            )}
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
