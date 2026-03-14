import { User as UserIcon, Settings, LogOut, ChevronRight, GraduationCap, X, Save, Bell, Key, Target, Globe, ShieldCheck, MessageCircle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { logOut, auth } from '@/firebase';
import { useEffect, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { user, updateUser, goals } = useAppContext();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeModal, setActiveModal] = useState<'personal' | 'settings' | null>(null);

  // Form states for personal data
  const [editName, setEditName] = useState(user?.name || '');
  const [editAge, setEditAge] = useState(user?.ageProfile || 'joven');
  const [isSaving, setIsSaving] = useState(false);

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const APP_URL = 'https://iahorra-certus.vercel.app';
  const SHARE_TEXT = 'Te comparto IAhorra CERTUS para aprender y mejorar tus finanzas:';

  useEffect(() => {
    setNotifications(user?.notificationsEnabled ?? true);
  }, [user?.notificationsEnabled]);

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSavePersonalData = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await updateUser({
        name: editName,
        ageProfile: editAge as any
      });
      showNotification('Datos actualizados correctamente ✅');
      setActiveModal(null);
    } catch (error) {
      console.error(error);
      showNotification('Error al guardar los datos ❌');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth.currentUser?.email) {
      showNotification('No se pudo enviar el correo ❌');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      showNotification('Correo de recuperación enviado 📧');
    } catch (error) {
      console.error(error);
      showNotification('Error al enviar el correo ❌');
    }
  };

  const handleToggleNotifications = async () => {
    const nextValue = !notifications;
    setNotifications(nextValue);

    if (nextValue) {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setNotifications(false);
        showNotification('Tu navegador no soporta notificaciones ❌');
        return;
      }

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        setNotifications(false);
        showNotification('Debes permitir notificaciones para activarlas 🔔');
        try {
          await updateUser({ notificationsEnabled: false });
        } catch (error) {
          console.error(error);
        }
        return;
      }
    }

    try {
      await updateUser({ notificationsEnabled: nextValue });
      showNotification(nextValue ? 'Notificaciones activadas 🔔' : 'Notificaciones desactivadas');
    } catch (error) {
      console.error(error);
      setNotifications(!nextValue);
      showNotification('No se pudo guardar la configuración ❌');
    }
  };

  const handleShareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'IAhorra CERTUS',
          text: SHARE_TEXT,
          url: APP_URL,
        });
        showNotification('Enlace listo para compartir ✅');
        return;
      }
    } catch (error) {
      // Si se cancela el share nativo, no mostramos error para evitar fricción.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${APP_URL}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    showNotification('Abriendo WhatsApp para compartir');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-certus-blue text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      <div className="bg-certus-blue px-6 pt-12 pb-8 shadow-sm rounded-b-[40px] flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-certus-cyan rounded-full flex items-center justify-center text-certus-blue font-display font-bold text-4xl border-4 border-white mb-3">
          {user.name.charAt(0).toUpperCase() || 'V'}
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{user.name || 'Valeria'}</h1>
        <p className="text-certus-cyan text-sm font-medium capitalize mt-1">
          Perfil: {user.ageProfile ? user.ageProfile.replace('_', ' ') : 'Joven'}
        </p>
      </div>

      <div className="p-6 flex flex-col gap-6 -mt-4 relative z-10 max-w-2xl mx-auto w-full">
        
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
          <MenuItem icon={<UserIcon size={20} />} label="Datos personales" onClick={() => {
            setEditName(user.name || '');
            setEditAge(user.ageProfile || 'joven');
            setActiveModal('personal');
          }} />
          <MenuItem icon={<Settings size={20} />} label="Configuración" onClick={() => setActiveModal('settings')} />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-certus-cyan" size={20} />
            <h2 className="font-display font-bold text-certus-blue">Mis Metas</h2>
          </div>
          <div className="flex flex-col gap-3">
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">No tienes metas activas.</p>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-certus-light rounded-xl">
                  <div>
                    <p className="font-medium text-certus-blue text-sm">{goal.name}</p>
                    <p className="text-xs text-gray-500">
                      S/ {goal.currentAmount.toFixed(2)} de S/ {goal.targetAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full",
                      goal.status === 'completed' ? "bg-certus-green/10 text-certus-green" : "bg-certus-cyan/10 text-certus-cyan"
                    )}>
                      {goal.status === 'completed' ? 'Completada' : 'En progreso'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-certus-blue to-[#1a2e7a] rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <GraduationCap size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="text-certus-cyan" size={24} />
              <h2 className="font-display font-bold text-lg">¿Quieres estudiar Administración Financiera y Banca Digital en CERTUS?</h2>
            </div>
            <img
              src="/01_Brand_Core/lockup_institucional/logo-white-certus-peru.png"
              alt="Logo CERTUS Perú"
              className="h-8 sm:h-9 w-auto mb-3"
              loading="lazy"
            />
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              Descubre nuestra carrera. Invierte en tu futuro hoy mismo.
            </p>
            <a 
              href="https://www.certus.edu.pe/carrera/administracion-financiera-y-banca-digital/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-certus-cyan text-certus-blue font-display font-bold px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors"
            >
              Ver carrera
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#1a2e7a] to-certus-blue rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Globe size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="text-certus-cyan" size={24} />
              <h2 className="font-display font-bold text-lg">Semana Mundial del Ahorro 2026</h2>
            </div>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              Descubre eventos, consejos y más sobre la importancia de ahorrar.
            </p>
            <a 
              href="https://semanamundialdelahorro.pe/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-certus-cyan text-certus-blue font-display font-bold px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors"
            >
              Visitar sitio
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-r from-certus-blue to-[#1a2e7a] rounded-2xl p-5 shadow-md text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-certus-cyan" size={24} />
              <h2 className="font-display font-bold text-lg">Portal SBS para Usuarios</h2>
            </div>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              Descubre los servicios, contenidos educativos, programas y materiales que la SBS ha preparado para ti.
            </p>
            <a 
              href="https://www.sbs.gob.pe/usuarios/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-certus-cyan text-certus-blue font-display font-bold px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors"
            >
              Ir al portal
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display font-bold text-certus-blue text-sm">Comparte IAhorra</p>
              <p className="text-xs text-gray-500 mt-1">Invita a alguien a mejorar sus finanzas contigo.</p>
            </div>
            <button
              type="button"
              onClick={handleShareApp}
              aria-label="Compartir IAhorra por WhatsApp"
              className="inline-flex items-center gap-2 bg-certus-green text-white font-display font-bold px-4 py-2.5 rounded-xl hover:bg-opacity-90 transition-all whitespace-nowrap"
            >
              <MessageCircle size={16} />
              Compartir
            </button>
          </div>
        </div>

        <button 
          onClick={handleLogOut}
          className="w-full bg-white border border-certus-error text-certus-error font-display font-bold py-4 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          IAhorra CERTUS v2.0.0<br/>
          CERTUS Licenciado por MINEDU<br/>
        </p>
      </div>

      {/* Modals */}
      {activeModal === 'personal' && (
        <div className="fixed inset-0 bg-certus-blue/80 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="bg-certus-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <UserIcon className="text-certus-cyan" size={20} />
                Datos Personales
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-white/70 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-certus-light border border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de edad</label>
                <select 
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value as any)}
                  className="w-full bg-certus-light border border-transparent focus:border-certus-cyan rounded-xl px-4 py-3 outline-none transition-colors appearance-none"
                >
                  <option value="niño">Niño (10-12 años)</option>
                  <option value="joven">Joven (13-22 años)</option>
                  <option value="adulto_joven">Adulto joven (23-35 años)</option>
                  <option value="adulto">Adulto (36 a más)</option>
                  <option value="emprendedor">Emprendedor</option>
                </select>
              </div>
              <button
                onClick={handleSavePersonalData}
                disabled={isSaving || !editName.trim()}
                className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Guardando...' : <><Save size={20} /> GUARDAR CAMBIOS</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-certus-blue/80 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="bg-certus-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Settings className="text-certus-cyan" size={20} />
                Configuración
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-white/70 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-certus-light rounded-full flex items-center justify-center text-certus-blue">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-certus-blue">Notificaciones</p>
                    <p className="text-xs text-gray-500">Recibe alertas y recordatorios</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggleNotifications}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    notifications ? "bg-certus-green" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                    notifications ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="h-[1px] bg-gray-100 w-full"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-certus-light rounded-full flex items-center justify-center text-certus-blue">
                    <Key size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-certus-blue">Contraseña</p>
                    <p className="text-xs text-gray-500">Cambia tu clave de acceso</p>
                  </div>
                </div>
                <button 
                  onClick={handleResetPassword}
                  className="text-xs font-bold text-certus-magenta bg-certus-magenta/10 px-3 py-2 rounded-lg hover:bg-certus-magenta/20 transition-colors"
                >
                  RESTABLECER
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
    >
      <div className="flex items-center gap-3 text-certus-blue">
        <div className="text-gray-400">{icon}</div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </div>
  );
}
