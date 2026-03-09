import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { Home, MessageSquare, PieChart, TrendingUp, User, PiggyBank, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';

export default function MainLayout() {
  const { isAuthReady, firebaseUser, user } = useAppContext();
  const [logoError, setLogoError] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-certus-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-certus-magenta"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-certus-light w-full relative shadow-2xl overflow-hidden md:flex-row">
      {/* Sidebar for desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 z-50 shrink-0">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm border border-gray-100">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain" 
                onError={() => setLogoError(true)}
              />
            ) : (
              <PiggyBank className="text-certus-blue w-5 h-5" />
            )}
          </div>
          <span className="font-display font-bold text-xl text-certus-blue">IAhorra</span>
        </div>
        <div className="flex flex-col gap-2">
          <NavItem to="/home" icon={<Home size={24} />} label="Inicio" desktop />
          <NavItem to="/chat" icon={<MessageSquare size={24} />} label="Chat" desktop />
          <NavItem to="/simulator" icon={<PieChart size={24} />} label="Simulador" desktop />
          <NavItem to="/budget" icon={<Calculator size={24} />} label="Presupuesto" desktop />
          <NavItem to="/progress" icon={<TrendingUp size={24} />} label="Progreso" desktop />
          <NavItem to="/profile" icon={<User size={24} />} label="Perfil" desktop />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-[72px] md:pb-0 flex flex-col relative w-full">
        <Outlet />
      </main>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 h-[72px]">
        <NavItem to="/home" icon={<Home size={24} />} label="Inicio" />
        <NavItem to="/chat" icon={<MessageSquare size={24} />} label="Chat" />
        <NavItem to="/simulator" icon={<PieChart size={24} />} label="Simulador" />
        <NavItem to="/budget" icon={<Calculator size={24} />} label="Presupuesto" />
        <NavItem to="/progress" icon={<TrendingUp size={24} />} label="Progreso" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, desktop }: { to: string; icon: React.ReactNode; label: string; desktop?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "transition-colors",
          desktop 
            ? "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm" 
            : "flex flex-col items-center gap-1 text-xs font-medium",
          isActive 
            ? (desktop ? "bg-certus-light text-certus-magenta" : "text-certus-magenta") 
            : "text-gray-400 hover:text-certus-blue"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
