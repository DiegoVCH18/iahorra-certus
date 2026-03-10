import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { signInWithGoogle, auth, db } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously } from 'firebase/auth';
import { setDoc, doc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import Footer from '@/components/Footer';

export default function Login() {
  const navigate = useNavigate();
  const { firebaseUser, user, isAuthReady } = useAppContext();
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthReady && firebaseUser) {
      if (user) {
        navigate('/home');
      } else {
        navigate('/onboarding', { state: { name } });
      }
    }
  }, [isAuthReady, firebaseUser, user, navigate, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        // Create account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        // The AppContext will handle the redirect to onboarding
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Iniciar el popup inmediatamente antes de cualquier cambio de estado para evitar el bloqueo en Safari/iOS
      const signInPromise = signInWithGoogle();
      setLoading(true);
      await signInPromise;
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
        setError('El inicio de sesión con Google fue bloqueado por tu navegador. Por favor, usa tu correo y contraseña para registrarte o ingresar.');
      } else {
        setError(err.message || 'Error al iniciar sesión con Google.');
      }
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      const cred = await signInAnonymously(auth);
      
      // Create mock data for demo user
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: 'Invitado',
        ageProfile: 'joven',
        savedAmount: 1500,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'goals'), {
        userId: cred.user.uid,
        name: 'Viaje a Cusco',
        targetAmount: 3000,
        currentAmount: 1500,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'budgets'), {
        userId: cred.user.uid,
        fixedIncome: 2000,
        variableIncome: 500,
        fixedExpenses: 1200,
        variableExpenses: 400,
        updatedAt: serverTimestamp()
      });

      // Increment global stats
      try {
        await setDoc(doc(db, 'public_stats', 'global'), { 
          totalUsers: increment(1),
          totalGoals: increment(1)
        }, { merge: true });
      } catch (e) {
        console.error("Failed to update global stats", e);
      }

      // AppContext will handle the rest and redirect to home
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation') {
        setError('El inicio de sesión anónimo está deshabilitado. Por favor, habilítalo en la consola de Firebase.');
      } else {
        setError('Error al iniciar modo demo.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-certus-light w-full items-center justify-center">
      <div className="w-full max-w-md bg-white h-full sm:h-auto sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-certus-blue pt-12 pb-6 px-6 flex flex-col items-center sm:rounded-t-3xl shadow-md">
        <div className="flex items-center gap-3 text-white mb-6">
          <div className="bg-white p-1 rounded-xl w-12 h-12 flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <PiggyBank className="text-certus-blue w-8 h-8 hidden" />
          </div>
          <h1 className="font-display text-2xl font-bold">IAhorra <span className="text-certus-cyan">CERTUS</span></h1>
        </div>
        
        <div className="flex w-full bg-white/10 rounded-lg p-1">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-display font-semibold rounded-md transition-colors ${!isLogin ? 'bg-white text-certus-blue' : 'text-white'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Crear cuenta
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-display font-semibold rounded-md transition-colors ${isLogin ? 'bg-white text-certus-blue' : 'text-white'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Ingresar
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-certus-error text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Nombres*</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-3 outline-none transition-colors" 
                  placeholder="Ej. Valeria"
                />
              </div>
            </>
          )}
          
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Correo*</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-3 outline-none transition-colors" 
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Contraseña*</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-certus-light border border-transparent focus:border-certus-cyan rounded-lg px-4 py-3 outline-none transition-colors" 
            />
          </div>

          {!isLogin && (
            <div className="flex items-start gap-2 mt-2">
              <input type="checkbox" required className="mt-1" id="terms" />
              <label htmlFor="terms" className="text-xs text-gray-500">
                He leído y acepto las Políticas de Privacidad
              </label>
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <a href="#" className="text-xs text-certus-cyan hover:underline">¿Olvidaste tu contraseña?</a>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-md mt-4 disabled:opacity-50"
          >
            {loading ? 'CARGANDO...' : (isLogin ? 'INGRESAR' : 'CREAR MI CUENTA')}
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">O</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-200 text-gray-700 font-display font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <button 
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mt-3 bg-certus-light border border-certus-blue/20 text-certus-blue font-display font-semibold py-3 rounded-xl hover:bg-certus-blue/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Explorar sin registrarse
          </button>
        </form>
        <Footer />
      </div>
    </div>
    </div>
  );
}
