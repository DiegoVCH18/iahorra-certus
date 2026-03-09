import { ShieldAlert, AlertTriangle, CheckCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Frauds() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-certus-error px-6 py-6 shadow-sm sticky top-0 z-10 rounded-b-3xl">
        <div className="flex items-center gap-2 mb-2 text-white">
          <ShieldAlert size={28} />
          <h1 className="font-display text-xl font-bold">Protégete de fraudes</h1>
        </div>
        <p className="text-white/90 text-sm">Aprende a identificar estafas digitales en Perú.</p>
      </div>

      <div className="p-6 flex flex-col gap-6 -mt-4 relative z-20 max-w-2xl mx-auto w-full">
        
        <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-certus-error">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-certus-error" size={20} />
            <h2 className="font-display font-bold text-certus-blue">Alertas Recientes</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            <AlertItem 
              title="El falso Yape/Plin" 
              desc="Te envían una captura falsa de transferencia. Verifica siempre en tu app antes de entregar el producto."
            />
            <AlertItem 
              title="Phishing bancario" 
              desc="SMS o correos que dicen 'Tu cuenta fue bloqueada'. Nunca hagas clic en esos enlaces."
            />
            <AlertItem 
              title="Préstamos 'gota a gota' virtuales" 
              desc="Apps que ofrecen dinero sin requisitos pero roban tus contactos para extorsionarte."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-display font-bold text-certus-blue mb-4">Checklist de Seguridad</h2>
          
          <div className="flex flex-col gap-3">
            <CheckItem text="Mi contraseña de banco no es mi cumpleaños" checked={true} />
            <CheckItem text="Tengo activada la verificación en dos pasos" checked={false} />
            <CheckItem text="No comparto mi PIN ni clave dinámica" checked={true} />
            <CheckItem text="Reviso mis movimientos bancarios cada semana" checked={false} />
          </div>
        </div>

        <button 
          onClick={() => navigate('/chat', { state: { initialPrompt: '¿Cuáles son los fraudes digitales más comunes en Perú y cómo los evito?' } })}
          className="w-full bg-certus-cyan text-certus-blue font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <MessageSquare size={20} />
          Pregúntale a IAhorra
        </button>

        <p className="text-center text-[10px] text-gray-400 italic">
          Fuente: Superintendencia de Banca, Seguros y AFP (SBS)
        </p>
      </div>
    </div>
  );
}

function AlertItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-red-50 p-3 rounded-xl">
      <h3 className="font-semibold text-certus-error text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-700 leading-relaxed">{desc}</p>
    </div>
  );
}

function CheckItem({ text, checked }: { text: string, checked: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 shrink-0 ${checked ? 'text-certus-success' : 'text-gray-300'}`}>
        <CheckCircle size={18} />
      </div>
      <span className={`text-sm ${checked ? 'text-gray-600' : 'text-gray-400'}`}>{text}</span>
    </div>
  );
}
