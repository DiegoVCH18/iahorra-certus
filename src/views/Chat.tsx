import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import BrandIsotipo from '@/components/BrandIsotipo';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  cta?: { label: string; to: string };
  timestamp?: string;
}

const SUGGESTIONS = [
  "¿Cómo empiezo a ahorrar?",
  "¿Qué es una tasa de interés?",
  "Ayúdame con mi presupuesto",
  "¿Cómo evito fraudes digitales?"
];

export default function Chat() {
  const { user, firebaseUser, goals } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPromptHandledRef = useRef(false);

  const activeGoal = goals.find(g => g.status === 'active') || goals[0];
  const activeGoalName = activeGoal?.name || 'Aprender a ahorrar';

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', firebaseUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let cta;
        if (data.role === 'model') {
          const textLower = data.text.toLowerCase();
          if (textLower.includes('simulador') || textLower.includes('presupuesto')) {
            cta = { label: 'Ver en simulador', to: '/simulator' };
          } else if (textLower.includes('fraude') || textLower.includes('estafa')) {
            cta = { label: 'Ir a Evita Fraudes', to: '/frauds' };
          }
        }
        fetchedMessages.push({
          id: doc.id,
          role: data.role as 'user' | 'model',
          text: data.text,
          cta,
          timestamp: data.timestamp
        });
      });

      const initialMsg: Message = {
        id: 'greeting',
        role: 'model',
        text: `¡Hola, ${user?.name || 'Valeria'}! Soy IAhorra, tu mentor financiero de CERTUS. Veo que tu meta es "${activeGoalName}". ¿En qué te puedo ayudar hoy? 🌱`
      };

      if (fetchedMessages.length === 0) {
        setMessages([initialMsg]);
      } else {
        setMessages([initialMsg, ...fetchedMessages]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });

    return () => unsubscribe();
  }, [firebaseUser, user?.name, activeGoalName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessage = async (role: 'user' | 'model', text: string) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'chats'), {
        userId: firebaseUser.uid,
        role,
        text,
        timestamp: new Date().toISOString()
      });
      // Increment global stats for chats
      try {
        await setDoc(doc(db, 'public_stats', 'global'), { totalChats: increment(1) }, { merge: true });
      } catch (e) {
        console.error("Failed to update global stats for chats", e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !firebaseUser) return;

    // Capture history before any async operations to prevent including the new message
    const currentHistory = [...messages];

    // Optimistic update for user message
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to Firestore
      await saveMessage('user', text);

      let apiKey = "";
      try {
        apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      } catch (e) {}

      if (!apiKey || apiKey === "undefined") {
        try {
          apiKey = process.env.GEMINI_API_KEY;
        } catch (e) {}
      }

      if (!apiKey || apiKey === "undefined") {
        try {
          apiKey = process.env.API_KEY;
        } catch (e) {}
      }
      
      if (!apiKey || apiKey === "undefined") {
        const win = window as any;
        if (typeof window !== 'undefined' && win.aistudio && win.aistudio.openSelectKey) {
          await win.aistudio.openSelectKey();
          // After selection, the key should be available in process.env.API_KEY
          try {
            apiKey = process.env.API_KEY;
          } catch (e) {}
        }
      }

      if (!apiKey || apiKey === "undefined") {
        throw new Error("Gemini API key is missing or invalid. Please select an API key.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `
        Eres IAhorra, el asistente virtual educativo oficial de IAhorra CERTUS, una plataforma de educación financiera desarrollada por Instituto CERTUS (certus.edu.pe).
        Tu misión es enseñar finanzas personales de forma clara, cercana y sin tecnicismos.
        El usuario se llama ${user?.name || 'Valeria'}, su perfil de edad es ${user?.ageProfile || 'joven'}, y su meta actual es "${activeGoalName}".
        Comunícate en primera persona, usa emojis, sé motivador y adapta tu lenguaje a su edad.
        Usa ejemplos cotidianos peruanos (Yape, propinas, mercado, etc.).
        NUNCA recomiendes productos financieros específicos de bancos.
        Si la respuesta es larga, sugiere usar el simulador o ir a la sección de educación.
        Mantenlo breve, máximo 3-4 párrafos cortos.
      `;

      // Filter out greeting
      const historyToReplay = currentHistory.filter(m => m.id !== 'greeting');
      
      const chatHistory: { role: string, parts: { text: string }[] }[] = [];
      let lastRole = '';
      
      for (const m of historyToReplay) {
        if (m.role === 'user') {
          if (lastRole === 'user') {
            chatHistory[chatHistory.length - 1].parts[0].text += '\n' + m.text;
          } else {
            chatHistory.push({ role: 'user', parts: [{ text: m.text }] });
            lastRole = 'user';
          }
        } else if (m.role === 'model') {
          if (lastRole === 'model') {
            chatHistory[chatHistory.length - 1].parts[0].text += '\n' + m.text;
          } else if (lastRole === 'user') {
            chatHistory.push({ role: 'model', parts: [{ text: m.text }] });
            lastRole = 'model';
          } else {
            chatHistory.push({ role: 'user', parts: [{ text: 'Hola' }] });
            chatHistory.push({ role: 'model', parts: [{ text: m.text }] });
            lastRole = 'model';
          }
        }
      }

      // Ensure the history doesn't end with a user message (since we're about to send one)
      if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        chatHistory.pop();
      }

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: chatHistory.length > 0 ? chatHistory : undefined
      });

      let responseText = '';
      try {
        const response = await chat.sendMessage({ message: text });
        responseText = response.text || '';
      } catch (error: any) {
        if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key not valid')) {
          const win = window as any;
          if (typeof window !== 'undefined' && win.aistudio && win.aistudio.openSelectKey) {
            await win.aistudio.openSelectKey();
            let newApiKey = "";
            try {
              newApiKey = process.env.API_KEY;
            } catch (e) {}
            if (!newApiKey || newApiKey === "undefined") {
              try {
                newApiKey = import.meta.env.VITE_GEMINI_API_KEY;
              } catch (e) {}
            }
            if (newApiKey && newApiKey !== "undefined") {
              const newAi = new GoogleGenAI({ apiKey: newApiKey });
              const newChat = newAi.chats.create({
                model: "gemini-3-flash-preview",
                config: {
                  systemInstruction,
                  temperature: 0.7,
                },
                history: chatHistory.length > 0 ? chatHistory : undefined
              });
              const response = await newChat.sendMessage({ message: text });
              responseText = response.text || '';
            } else {
              throw new Error("No se pudo obtener una nueva API key válida.");
            }
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
      
      // Save model response to Firestore
      await saveMessage('model', responseText);

    } catch (error: any) {
      console.error("Error calling Gemini:", error);
      // We don't save error messages to DB, just show them temporarily
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `Uy, tuve un pequeño problema técnico. Detalle: ${error?.message || 'Error desconocido'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.initialPrompt && !initialPromptHandledRef.current && firebaseUser) {
      const prompt = location.state.initialPrompt;
      initialPromptHandledRef.current = true;
      // Clear state to avoid re-triggering
      window.history.replaceState({}, document.title);
      handleSend(prompt);
    }
  }, [location.state, firebaseUser]);

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Header */}
      <div className="bg-certus-blue px-4 py-4 flex items-center justify-center shadow-md z-10 sticky top-0">
        <div className="w-full max-w-3xl flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden p-1">
              <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-6 h-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-certus-green rounded-full border-2 border-certus-blue"></div>
          </div>
          <div>
            <h2 className="font-display font-bold text-white leading-tight">IAhorra</h2>
            <p className="text-xs text-certus-green font-medium">● En línea</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-certus-light/30 items-center">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", msg.role === 'user' ? "self-end flex-row-reverse" : "self-start")}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden p-0.5 border border-certus-light">
                  <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-4 h-4" />
                </div>
              )}
              
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-certus-blue text-white rounded-tr-sm" 
                  : "bg-white text-certus-text border-l-4 border-certus-cyan shadow-sm rounded-tl-sm"
              )}>
                {msg.role === 'model' ? (
                  <div className="markdown-body prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  msg.text
                )}
                
                {msg.cta && (
                  <button 
                    onClick={() => navigate(msg.cta!.to)}
                    className="mt-3 flex items-center gap-1 text-certus-magenta font-display font-semibold text-xs hover:underline"
                  >
                    {msg.cta.label} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 max-w-[85%] self-start">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden p-0.5 border border-certus-light">
                <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-4 h-4" />
              </div>
              <div className="bg-white p-4 rounded-2xl border-l-4 border-certus-cyan shadow-sm rounded-tl-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-certus-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-certus-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-certus-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar pb-2 justify-center">
          <div className="flex gap-2 max-w-3xl w-full">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap bg-white border border-certus-cyan text-certus-cyan px-3 py-1.5 rounded-full text-xs font-medium hover:bg-certus-light transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-2 bg-certus-light rounded-full p-1 pr-2 border border-transparent focus-within:border-certus-cyan transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-certus-magenta text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-colors shrink-0"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
          <div className="text-center mt-3">
            <a 
              href="https://chatgpt.com/g/g-67aba26880108191b0e99b100eeb3632-iahorra-certus-educacion-financiera-del-futuro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 hover:text-certus-cyan underline"
            >
              ¿Quieres una experiencia más completa? Prueba IAhorra en ChatGPT →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
