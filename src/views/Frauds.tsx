import { 
  ShieldAlert, AlertTriangle, CheckCircle, XCircle, MessageSquare, 
  PlayCircle, ExternalLink, PhoneCall, Smartphone, ShieldCheck, 
  Lock, CreditCard, Monitor, ShoppingBag, EyeOff, MapPin, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

type TabType = 'tipos' | 'escenarios' | 'alertas' | 'checklist';
type ScenarioType = 'fisico' | 'web' | 'app' | 'compras';

const CHECKLIST_IDS = ['chk1', 'chk2', 'chk3', 'chk4', 'chk5', 'chk6', 'chk7', 'chk8'];

export default function Frauds() {
  const navigate = useNavigate();
  const { user, updateUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('tipos');
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('fisico');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    const source = Array.isArray(user?.fraudChecklist) ? user.fraudChecklist : [];
    const normalized = CHECKLIST_IDS.filter((id) => source.includes(id));
    setCheckedItems(normalized);
  }, [user?.fraudChecklist]);

  const allChecked = checkedItems.length >= CHECKLIST_IDS.length;

  const handleChecklistChange = async (id: string, isChecked: boolean) => {
    const updated = isChecked
      ? Array.from(new Set([...checkedItems, id]))
      : checkedItems.filter(item => item !== id);

    const normalized = CHECKLIST_IDS.filter((checkId) => updated.includes(checkId));
    setCheckedItems(normalized);

    if (user) {
      try {
        await updateUser({ fraudChecklist: normalized });
      } catch (error) {
        console.error('Failed to save checklist', error);
        // Rollback local state if persistence fails.
        const source = Array.isArray(user?.fraudChecklist) ? user.fraudChecklist : [];
        const rollback = CHECKLIST_IDS.filter((checkId) => source.includes(checkId));
        setCheckedItems(rollback);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-20">
      {/* Hero Section */}
      <div className="bg-certus-blue px-6 pt-8 pb-12 shadow-md relative overflow-hidden rounded-b-[2rem]">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <ShieldAlert size={200} />
        </div>
        <div className="relative z-10 flex flex-col gap-4 text-white max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-certus-error/20 p-3 rounded-2xl backdrop-blur-sm border border-certus-error/30">
              <ShieldAlert size={32} className="text-certus-error" />
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              Protégete de fraudes<br/>y opera con seguridad
            </h1>
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-md">
            Aprende a prevenir estafas digitales, telefónicas y en espacios físicos. Tu seguridad financiera depende de estar informado.
          </p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6 -mt-6 relative z-20 max-w-2xl mx-auto w-full">
        
        {/* Video Section */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <PlayCircle className="text-certus-magenta" size={20} />
            <h2 className="font-display font-bold text-certus-blue">Aprende a prevenir fraudes</h2>
          </div>
          <div className="relative w-full pt-[56.25%] bg-black">
            <iframe 
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/xDHGmOp850c?rel=0" 
              title="Video educativo sobre prevención de fraudes"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <TabButton active={activeTab === 'tipos'} onClick={() => setActiveTab('tipos')}>Modalidades</TabButton>
          <TabButton active={activeTab === 'escenarios'} onClick={() => setActiveTab('escenarios')}>Escenarios</TabButton>
          <TabButton active={activeTab === 'alertas'} onClick={() => setActiveTab('alertas')}>Qué hacer</TabButton>
          <TabButton active={activeTab === 'checklist'} onClick={() => setActiveTab('checklist')}>Checklist</TabButton>
        </div>

        {/* Tab Content: Tipos de Fraude */}
        {activeTab === 'tipos' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="font-display font-bold text-certus-blue px-2 flex items-center gap-2">
              <AlertTriangle className="text-certus-error" size={20} />
              Modalidades más frecuentes
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <FraudCard 
                icon={<Smartphone className="text-certus-error" />}
                title="Falso Yape / Plin"
                desc="Te muestran una captura de pantalla falsa de una transferencia que nunca llegó a tu cuenta."
                alert="Nunca entregues el producto sin verificar primero en tu propia aplicación."
              />
              <FraudCard 
                icon={<Lock className="text-certus-error" />}
                title="Phishing Bancario"
                desc="Correos o SMS alarmantes diciendo que tu cuenta fue bloqueada y piden que ingreses a un enlace."
                alert="Los bancos nunca envían enlaces por SMS para desbloquear cuentas."
              />
              <FraudCard 
                icon={<PhoneCall className="text-certus-error" />}
                title="Llamadas Sospechosas"
                desc="Se hacen pasar por tu banco alertando de un fraude y te piden tus claves o códigos OTP para 'cancelarlo'."
                alert="El banco nunca te pedirá tu clave secreta, PIN o código OTP por teléfono."
              />
              <FraudCard 
                icon={<ShieldAlert className="text-certus-error" />}
                title="Premios Falsos"
                desc="Mensajes anunciando que ganaste un sorteo, pero te piden un depósito previo para 'liberar' el premio."
                alert="Si te piden dinero para darte un premio, es una estafa segura."
              />
              <FraudCard 
                icon={<CreditCard className="text-certus-error" />}
                title="Robo en Espacios Físicos"
                desc="Cambiazo de tarjeta en cajeros o robo visual de tu clave al momento de pagar en un POS."
                alert="Nunca pierdas de vista tu tarjeta y cubre el teclado al digitar tu clave."
              />
              <FraudCard 
                icon={<Monitor className="text-certus-error" />}
                title="Préstamos Engañosos"
                desc="Apps que ofrecen dinero rápido sin requisitos, pero roban tu información y contactos para extorsionarte."
                alert="Solo solicita préstamos en entidades reguladas por la SBS."
              />
            </div>
          </div>
        )}

        {/* Tab Content: Escenarios de Seguridad */}
        {activeTab === 'escenarios' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="font-display font-bold text-certus-blue px-2 flex items-center gap-2">
              <MapPin className="text-certus-cyan" size={20} />
              Seguridad por escenarios
            </h2>

            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-2 scrollbar-hide">
              <ScenarioButton 
                active={activeScenario === 'fisico'} 
                onClick={() => setActiveScenario('fisico')}
                icon={<CreditCard size={16} />}
                label="Físico"
              />
              <ScenarioButton 
                active={activeScenario === 'web'} 
                onClick={() => setActiveScenario('web')}
                icon={<Monitor size={16} />}
                label="Banca Web"
              />
              <ScenarioButton 
                active={activeScenario === 'app'} 
                onClick={() => setActiveScenario('app')}
                icon={<Smartphone size={16} />}
                label="Apps"
              />
              <ScenarioButton 
                active={activeScenario === 'compras'} 
                onClick={() => setActiveScenario('compras')}
                icon={<ShoppingBag size={16} />}
                label="Compras"
              />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mt-2">
              {activeScenario === 'fisico' && (
                <ScenarioContent 
                  title="En espacios físicos y cajeros"
                  icon={<CreditCard className="text-certus-blue" size={24} />}
                  items={[
                    "Protege tus tarjetas y documentos de identidad en todo momento.",
                    "No pierdas de vista tu tarjeta al pagar en establecimientos.",
                    "Revisa cajeros y POS antes de usarlos (busca elementos extraños).",
                    "Evita aceptar ayuda de desconocidos en cajeros automáticos.",
                    "Cubre el teclado con tu mano al ingresar tu clave secreta.",
                    "Revisa tus vouchers y movimientos bancarios frecuentemente."
                  ]}
                />
              )}
              {activeScenario === 'web' && (
                <ScenarioContent 
                  title="Al utilizar la banca por internet"
                  icon={<Monitor className="text-certus-blue" size={24} />}
                  items={[
                    "Ingresa solo digitando la dirección oficial del banco en el navegador.",
                    "Evita ingresar a tu banco desde enlaces en correos o buscadores.",
                    "Verifica que el sitio web tenga el candado de seguridad (HTTPS).",
                    "No uses computadoras públicas ni redes Wi-Fi abiertas para operar.",
                    "Cierra siempre tu sesión al terminar tus operaciones.",
                    "Cambia tus contraseñas periódicamente y no uses la misma para todo."
                  ]}
                />
              )}
              {activeScenario === 'app' && (
                <ScenarioContent 
                  title="Al usar aplicaciones móviles"
                  icon={<Smartphone className="text-certus-blue" size={24} />}
                  items={[
                    "Descarga aplicaciones únicamente desde tiendas oficiales (App Store, Google Play).",
                    "Mantén el sistema operativo de tu celular y tus apps actualizados.",
                    "Usa bloqueo de pantalla seguro (PIN, patrón complejo o biometría).",
                    "No compartas claves, PIN ni códigos de verificación (OTP) con nadie.",
                    "Evita instalar aplicaciones de origen dudoso o que pidan permisos excesivos.",
                    "Activa notificaciones por consumo para monitorear tus cuentas."
                  ]}
                />
              )}
              {activeScenario === 'compras' && (
                <ScenarioContent 
                  title="Si realizas compras por internet"
                  icon={<ShoppingBag className="text-certus-blue" size={24} />}
                  items={[
                    "Compra en comercios reconocidos y con buena reputación.",
                    "Revisa los comentarios y calificaciones de otros compradores.",
                    "Desconfía de ofertas demasiado buenas para ser verdad.",
                    "No compartas datos de tu tarjeta por WhatsApp, redes sociales o teléfono.",
                    "Usa métodos de pago seguros o tarjetas virtuales de un solo uso si es posible.",
                    "Verifica tus movimientos bancarios inmediatamente después de la compra."
                  ]}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Qué hacer y qué no hacer */}
        {activeTab === 'alertas' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Señales de Alerta */}
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <EyeOff className="text-orange-500" size={24} />
                <h2 className="font-display font-bold text-orange-600 text-lg">SEÑALES DE ALERTA COMUNES</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AlertBadge text="Mensajes con urgencia o amenazas" />
                <AlertBadge text="Enlaces extraños o acortados" />
                <AlertBadge text="Llamadas que piden claves o códigos" />
                <AlertBadge text="Páginas o apps de aspecto sospechoso" />
                <AlertBadge text="Ofertas irreales o premios sorpresa" />
                <AlertBadge text="Errores ortográficos en correos 'oficiales'" />
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-5 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="text-certus-green" size={24} />
                <h2 className="font-display font-bold text-certus-green text-lg">QUÉ SÍ HACER</h2>
              </div>
              <ul className="flex flex-col gap-3">
                <ActionItem icon={<CheckCircle size={18} className="text-certus-green" />} text="Verificar siempre los movimientos directamente en canales oficiales." />
                <ActionItem icon={<CheckCircle size={18} className="text-certus-green" />} text="Revisar notificaciones y estados de cuenta frecuentemente." />
                <ActionItem icon={<CheckCircle size={18} className="text-certus-green" />} text="Bloquear tus tarjetas o productos inmediatamente si hay sospecha." />
                <ActionItem icon={<CheckCircle size={18} className="text-certus-green" />} text="Cambiar contraseñas si crees que han sido expuestas." />
                <ActionItem icon={<CheckCircle size={18} className="text-certus-green" />} text="Activar la verificación en dos pasos (2FA) en tus cuentas." />
                <ActionItem icon={<CheckCircle size={18} className="text-certus-green" />} text="Reportar incidentes a tu banco de inmediato." />
              </ul>
            </div>

            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="text-certus-error" size={24} />
                <h2 className="font-display font-bold text-certus-error text-lg">QUÉ NO HACER</h2>
              </div>
              <ul className="flex flex-col gap-3">
                <ActionItem icon={<XCircle size={18} className="text-certus-error" />} text="NO compartir claves, PIN, códigos OTP o datos bancarios completos." />
                <ActionItem icon={<XCircle size={18} className="text-certus-error" />} text="NO abrir enlaces sospechosos enviados por SMS, WhatsApp o correo." />
                <ActionItem icon={<XCircle size={18} className="text-certus-error" />} text="NO confiar ciegamente en capturas de pantalla como prueba de pago." />
                <ActionItem icon={<XCircle size={18} className="text-certus-error" />} text="NO instalar aplicaciones de préstamos de origen dudoso." />
                <ActionItem icon={<XCircle size={18} className="text-certus-error" />} text="NO entregar tu tarjeta o documento de identidad a terceros." />
                <ActionItem icon={<XCircle size={18} className="text-certus-error" />} text="NO operar desde redes Wi-Fi públicas o equipos compartidos." />
              </ul>
            </div>

          </div>
        )}

        {/* Tab Content: Checklist */}
        {activeTab === 'checklist' && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-certus-cyan" size={28} />
              <div>
                <h2 className="font-display font-bold text-certus-blue text-lg">Tu Checklist de Seguridad</h2>
                <p className="text-xs text-gray-500">Marca las acciones que ya realizas para protegerte.</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{checkedItems.length} de {CHECKLIST_IDS.length} acciones</span>
                <span className="font-semibold text-certus-cyan">{Math.round((checkedItems.length / CHECKLIST_IDS.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-certus-cyan h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((checkedItems.length / CHECKLIST_IDS.length) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <ChecklistItem id="chk1" text="Uso contraseñas seguras y diferentes para mi banco y correo." checked={checkedItems.includes('chk1')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk2" text="Tengo activada la verificación en dos pasos (2FA)." checked={checkedItems.includes('chk2')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk3" text="Reviso mis movimientos bancarios frecuentemente." checked={checkedItems.includes('chk3')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk4" text="Nunca comparto mis claves ni códigos OTP por teléfono." checked={checkedItems.includes('chk4')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk5" text="Verifico el remitente antes de abrir cualquier enlace." checked={checkedItems.includes('chk5')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk6" text="Cubro el teclado al digitar mi clave en cajeros o POS." checked={checkedItems.includes('chk6')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk7" text="Descargo apps bancarias solo de tiendas oficiales." checked={checkedItems.includes('chk7')} onChange={handleChecklistChange} />
              <ChecklistItem id="chk8" text="No guardo mis contraseñas en notas del celular sin protección." checked={checkedItems.includes('chk8')} onChange={handleChecklistChange} />
            </div>

            {allChecked && (
              <div className="mt-6 bg-certus-cyan/10 border border-certus-cyan rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <Star className="text-certus-yellow shrink-0" size={28} fill="currentColor" />
                <div>
                  <p className="font-display font-bold text-certus-blue text-sm">¡Logro desbloqueado: Seguro! 🛡️</p>
                  <p className="text-xs text-gray-600 mt-0.5">Completaste todas las acciones de seguridad. Tu logro ya aparece en Progreso.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-certus-blue text-white rounded-2xl p-6 shadow-lg mt-4 text-center flex flex-col items-center gap-4">
          <ShieldAlert size={32} className="text-certus-cyan" />
          <div>
            <h3 className="font-display font-bold text-lg mb-1">Ante cualquier duda...</h3>
            <p className="text-sm text-white/80">Verifica siempre en canales oficiales y contacta de inmediato a tu entidad financiera.</p>
          </div>
          <button 
            onClick={() => navigate('/chat', { state: { initialPrompt: '¿Qué debo hacer si creo que he sido víctima de un fraude digital o físico?' } })}
            className="w-full bg-certus-magenta text-white font-display font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            <MessageSquare size={20} />
            Pregúntale a IAhorra
          </button>
        </div>

        {/* Fuentes Oficiales */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-2">
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Fuentes Oficiales (SBS):</p>
          <div className="flex flex-col gap-2">
            <SourceLink href="https://www.sbs.gob.pe/Portals/3/Dr-Finanzas-Que-no-te-pase.pdf" text="Guía: Que no te pase" />
            <SourceLink href="https://www.sbs.gob.pe/portals/3/educacion-financiera-pdf/cartilla%20adultos%204%20-%20MENSAJES%20Y%20LLAMADAS%20SOSPECHOSAS.pdf" text="Cartilla: Mensajes y llamadas sospechosas" />
            <SourceLink href="https://www.sbs.gob.pe/Portals/1/Operaciones.pdf" text="Recomendaciones de Operaciones" />
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Components ---

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap",
        active 
          ? "bg-certus-blue text-white shadow-sm" 
          : "text-gray-500 hover:text-certus-blue hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

function ScenarioButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
        active 
          ? "bg-certus-cyan/10 border-certus-cyan text-certus-blue" 
          : "bg-white border-gray-200 text-gray-600 hover:border-certus-cyan/50"
      )}
    >
      <span className={active ? "text-certus-cyan" : "text-gray-400"}>{icon}</span>
      {label}
    </button>
  );
}

function ScenarioContent({ title, icon, items }: { title: string, icon: React.ReactNode, items: string[] }) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="bg-certus-light p-2 rounded-lg">
          {icon}
        </div>
        <h3 className="font-display font-bold text-certus-blue text-lg">{title}</h3>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-certus-cyan"></div>
            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FraudCard({ icon, title, desc, alert }: { icon: React.ReactNode, title: string, desc: string, alert: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="bg-red-50 p-2 rounded-lg">
          {icon}
        </div>
        <h3 className="font-display font-bold text-certus-blue leading-tight">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
      <div className="bg-red-50/50 border-l-2 border-certus-error p-3 rounded-r-lg mt-auto">
        <p className="text-xs font-medium text-certus-error flex gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>{alert}</span>
        </p>
      </div>
    </div>
  );
}

function ActionItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
    </li>
  );
}

function AlertBadge({ text }: { text: string }) {
  return (
    <div className="bg-white border border-orange-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
      <span className="text-xs font-medium text-orange-800">{text}</span>
    </div>
  );
}

function ChecklistItem({ id, text, checked, onChange }: { id: string, text: string, checked: boolean, onChange: (id: string, checked: boolean) => void }) {
  return (
    <label htmlFor={id} className={cn(
      "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
      checked ? "bg-certus-cyan/10 border-certus-cyan" : "bg-gray-50 border-gray-200 hover:border-certus-cyan/50"
    )}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input 
          type="checkbox" 
          id={id} 
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(id, e.target.checked)}
        />
        <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-certus-cyan peer-checked:border-certus-cyan transition-colors"></div>
        <CheckCircle size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
      </div>
      <span className={cn("text-sm transition-colors", checked ? "text-certus-blue font-medium" : "text-gray-600")}>
        {text}
      </span>
    </label>
  );
}

function SourceLink({ href, text }: { href: string, text: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs text-certus-cyan hover:text-certus-blue transition-colors group"
    >
      <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      <span className="underline underline-offset-2">{text}</span>
    </a>
  );
}
